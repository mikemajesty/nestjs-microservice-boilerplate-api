import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type KarpenterNodeSecurityGroupResources = {
  karpenterNodeSecurityGroupId: pulumi.Output<string>
}

export type KarpenterNodeSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
  clusterSecurityGroupId: pulumi.Input<string>
}

const KARPENTER_NODE_SECURITY_GROUPS_COMPONENT_TYPE = 'boilerplate:network:KarpenterNodeSecurityGroups'
const ALL_PROTOCOLS = '-1'
const TCP_PROTOCOL = 'tcp'
const KUBELET_PORT = 10250
const PUBLIC_INTERNET_IPV4_CIDR = '0.0.0.0/0'
const KARPENTER_DISCOVERY_TAG = 'karpenter.sh/discovery'

export class KarpenterNodeSecurityGroups
  extends pulumi.ComponentResource
  implements KarpenterNodeSecurityGroupResources
{
  readonly karpenterNodeSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: KarpenterNodeSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(KARPENTER_NODE_SECURITY_GROUPS_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId, clusterSecurityGroupId } = args
    const karpenterNodeSecurityGroupName = resourceName(config, resourceNameSuffix.network.karpenterNodeSecurityGroup)
    const clusterName = resourceName(config, resourceNameSuffix.cluster.eks.cluster)

    const karpenterNodeSecurityGroup = new aws.ec2.SecurityGroup(
      karpenterNodeSecurityGroupName,
      {
        vpcId,
        ingress: [],
        egress: [],
        tags: createTags(config, {
          Name: karpenterNodeSecurityGroupName,
          [KARPENTER_DISCOVERY_TAG]: clusterName
        })
      },
      { parent: this }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'karpenter-node-self-ingress'),
      {
        securityGroupId: karpenterNodeSecurityGroup.id,
        referencedSecurityGroupId: karpenterNodeSecurityGroup.id,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Allow node-to-node traffic for Karpenter-managed app nodes'
      },
      { parent: karpenterNodeSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'karpenter-node-from-cluster-ingress'),
      {
        securityGroupId: karpenterNodeSecurityGroup.id,
        referencedSecurityGroupId: clusterSecurityGroupId,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Allow EKS control plane traffic to Karpenter-managed app nodes'
      },
      { parent: karpenterNodeSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'karpenter-kubelet-from-vpc-ingress'),
      {
        securityGroupId: karpenterNodeSecurityGroup.id,
        cidrIpv4: config.vpcCidr,
        fromPort: KUBELET_PORT,
        toPort: KUBELET_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow in-cluster access to the kubelet on Karpenter-managed app nodes for metrics collection'
      },
      { parent: karpenterNodeSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'karpenter-cluster-from-node-ingress'),
      {
        securityGroupId: clusterSecurityGroupId,
        referencedSecurityGroupId: karpenterNodeSecurityGroup.id,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Allow Karpenter-managed app nodes to reach the EKS control plane'
      },
      { parent: karpenterNodeSecurityGroup }
    )

    new aws.vpc.SecurityGroupEgressRule(
      resourceName(config, 'karpenter-node-egress'),
      {
        securityGroupId: karpenterNodeSecurityGroup.id,
        cidrIpv4: PUBLIC_INTERNET_IPV4_CIDR,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Allow Karpenter-managed app nodes to reach the internet and AWS services'
      },
      { parent: karpenterNodeSecurityGroup }
    )

    this.karpenterNodeSecurityGroupId = karpenterNodeSecurityGroup.id

    this.registerOutputs({
      karpenterNodeSecurityGroupId: this.karpenterNodeSecurityGroupId
    })
  }
}
