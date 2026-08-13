import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type NetworkSecurityGroupResources = {
  envoyInternalNlbSecurityGroupId: pulumi.Output<string>
}

export type NetworkSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
  vpcCidr: pulumi.Input<string>
}

const NETWORK_SECURITY_GROUPS_COMPONENT_TYPE = 'boilerplate:network:SecurityGroups'
const HTTP_PORT = 80
const HTTPS_PORT = 443
const TCP_PROTOCOL = 'tcp'
const ALL_PROTOCOLS = '-1'
const PUBLIC_INTERNET_IPV4_CIDR = '0.0.0.0/0'

export class NetworkSecurityGroups extends pulumi.ComponentResource implements NetworkSecurityGroupResources {
  readonly envoyInternalNlbSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: NetworkSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(NETWORK_SECURITY_GROUPS_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId, vpcCidr } = args

    // ============================================================
    // SG - NLB Interno do Envoy Gateway (Apenas CloudFront)
    // ============================================================
    const envoyInternalNlbSecurityGroupName = resourceName(config, resourceNameSuffix.network.nlbSecurityGroup)

    // CloudFront origin-facing prefix list is still useful for the legacy/public edge path.
    const cloudfrontPrefixList = aws.ec2.getManagedPrefixListOutput(
      {
        name: 'com.amazonaws.global.cloudfront.origin-facing',
        region: 'us-east-1' // Ajuste para sua região
      },
      { parent: this }
    )

    // CloudFront VPC Origin uses its own service-managed security group as the source.
    // Allow it explicitly so the NLB health checks and origin traffic can reach Envoy.
    const cloudfrontVpcOriginSecurityGroup = aws.ec2.getSecurityGroupOutput(
      {
        filters: [
          {
            name: 'group-name',
            values: ['CloudFront-VPCOrigins-Service-SG']
          },
          {
            name: 'vpc-id',
            values: [vpcId]
          }
        ]
      },
      { parent: this }
    )

    const envoyInternalNlbSecurityGroup = new aws.ec2.SecurityGroup(
      envoyInternalNlbSecurityGroupName,
      {
        vpcId,
        ingress: [],
        egress: [],
        tags: createTags(config, {
          Name: envoyInternalNlbSecurityGroupName,
          [`kubernetes.io/cluster/${resourceName(config, resourceNameSuffix.cluster.eks.cluster)}`]: 'owned'
        })
      },
      { parent: this }
    )

    // ✅ REGRA ÚNICA: HTTP + HTTPS (portas 80-443)
    // Isso reduz de 2 regras para 1, evitando o limite de 60 regras
    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'cloudfront-http-https-ingress'),
      {
        securityGroupId: envoyInternalNlbSecurityGroup.id,
        prefixListId: cloudfrontPrefixList.id,
        fromPort: HTTP_PORT, // 80
        toPort: HTTPS_PORT, // 443
        ipProtocol: TCP_PROTOCOL,
        description: 'Allows HTTP and HTTPS traffic only from CloudFront'
      },
      { parent: envoyInternalNlbSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'cloudfront-vpc-origin-ingress'),
      {
        securityGroupId: envoyInternalNlbSecurityGroup.id,
        referencedSecurityGroupId: cloudfrontVpcOriginSecurityGroup.id,
        fromPort: HTTP_PORT,
        toPort: HTTPS_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allows HTTP and HTTPS traffic only from CloudFront VPC Origin'
      },
      { parent: envoyInternalNlbSecurityGroup }
    )

    new aws.vpc.SecurityGroupEgressRule(
      resourceName(config, 'cloudfront-vpc-origin-egress'),
      {
        securityGroupId: cloudfrontVpcOriginSecurityGroup.id,
        referencedSecurityGroupId: envoyInternalNlbSecurityGroup.id,
        fromPort: HTTP_PORT,
        toPort: HTTPS_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allows CloudFront VPC Origin to reach the Envoy NLB'
      },
      { parent: this }
    )

    // Health checks dos nodes do EKS (tráfego interno da VPC)
    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, resourceNameSuffix.network.envoyNlbHealthCheck),
      {
        securityGroupId: envoyInternalNlbSecurityGroup.id,
        cidrIpv4: vpcCidr,
        fromPort: HTTP_PORT,
        toPort: HTTP_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Health checks of the EKS nodes to the NLB'
      },
      { parent: envoyInternalNlbSecurityGroup }
    )

    // Egress: libera tudo (o NLB precisa responder aos requests)
    new aws.vpc.SecurityGroupEgressRule(
      resourceName(config, resourceNameSuffix.network.envoyNlbEgress),
      {
        securityGroupId: envoyInternalNlbSecurityGroup.id,
        cidrIpv4: PUBLIC_INTERNET_IPV4_CIDR,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Allow outgoing traffic to any destination (NLB responses)'
      },
      { parent: envoyInternalNlbSecurityGroup }
    )

    this.envoyInternalNlbSecurityGroupId = envoyInternalNlbSecurityGroup.id

    this.registerOutputs({
      envoyInternalNlbSecurityGroupId: this.envoyInternalNlbSecurityGroupId
    })
  }
}
