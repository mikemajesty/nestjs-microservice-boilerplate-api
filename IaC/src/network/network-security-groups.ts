import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type NetworkSecurityGroupResources = {
  publicLoadBalancerSecurityGroupId: pulumi.Output<string>
}

export type NetworkSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
}

const NETWORK_SECURITY_GROUPS_COMPONENT_TYPE = 'boilerplate:network:SecurityGroups'
const HTTP_PORT = 80
const TCP_PROTOCOL = 'tcp'
const ALL_PROTOCOLS = '-1'
const PUBLIC_INTERNET_IPV4_CIDR = '0.0.0.0/0'

export class NetworkSecurityGroups extends pulumi.ComponentResource implements NetworkSecurityGroupResources {
  readonly publicLoadBalancerSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: NetworkSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(NETWORK_SECURITY_GROUPS_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId } = args
    const publicLoadBalancerSecurityGroupName = resourceName(
      config,
      ResourceNameSuffix.PUBLIC_LOAD_BALANCER_SECURITY_GROUP
    )

    // Este grupo nasce antes do Load Balancer para a futura entrada publica reutilizar uma fronteira de rede conhecida.
    const publicLoadBalancerSecurityGroup = new aws.ec2.SecurityGroup(
      publicLoadBalancerSecurityGroupName,
      {
        // Um Security Group sempre pertence a exatamente uma VPC.
        vpcId,
        // As regras ficam fora do grupo para separar a identidade do SG das permissoes de trafego.
        ingress: [],
        egress: [],
        // A tag Name costuma ser o primeiro campo usado para encontrar o recurso no Console da AWS.
        tags: createTags(config, {
          Name: publicLoadBalancerSecurityGroupName
        })
      },
      { parent: this }
    )

    // Ingress responde: quem pode entrar neste futuro Load Balancer?
    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, ResourceNameSuffix.PUBLIC_LOAD_BALANCER_HTTP_INGRESS_RULE),
      {
        securityGroupId: publicLoadBalancerSecurityGroup.id,
        cidrIpv4: PUBLIC_INTERNET_IPV4_CIDR,
        fromPort: HTTP_PORT,
        toPort: HTTP_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Permite trafego HTTP publico para o Load Balancer'
      },
      { parent: publicLoadBalancerSecurityGroup }
    )

    // Egress temporario responde: para onde este futuro Load Balancer pode enviar trafego enquanto o Envoy ainda nao existe?
    new aws.vpc.SecurityGroupEgressRule(
      resourceName(config, ResourceNameSuffix.PUBLIC_LOAD_BALANCER_TEMPORARY_EGRESS_RULE),
      {
        securityGroupId: publicLoadBalancerSecurityGroup.id,
        cidrIpv4: PUBLIC_INTERNET_IPV4_CIDR,
        ipProtocol: ALL_PROTOCOLS,
        description: 'Permite saida temporaria ate o Security Group do Envoy existir'
      },
      { parent: publicLoadBalancerSecurityGroup }
    )

    this.publicLoadBalancerSecurityGroupId = publicLoadBalancerSecurityGroup.id

    this.registerOutputs({
      publicLoadBalancerSecurityGroupId: this.publicLoadBalancerSecurityGroupId
    })
  }
}
