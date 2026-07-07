import * as awsx from '@pulumi/awsx'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type NetworkResources = {
  vpcId: pulumi.Output<string>
  publicSubnetIds: pulumi.Output<string[]>
  privateSubnetIds: pulumi.Output<string[]>
  internetGatewayId: pulumi.Output<string>
  natGatewayId: pulumi.Output<string>
}

export type NetworkArgs = {
  config: InfrastructureConfig
}

const VPC_NETWORK_COMPONENT_TYPE = 'boilerplate:network:VPC'
const KUBERNETES_PUBLIC_LOAD_BALANCER_SUBNET_ROLE_TAG = 'kubernetes.io/role/elb'
const KUBERNETES_INTERNAL_LOAD_BALANCER_SUBNET_ROLE_TAG = 'kubernetes.io/role/internal-elb'
const KUBERNETES_SUBNET_ROLE_TAG_ENABLED_VALUE = '1'

export class VPCNetwork extends pulumi.ComponentResource implements NetworkResources {
  readonly vpcId: pulumi.Output<string>
  readonly publicSubnetIds: pulumi.Output<string[]>
  readonly privateSubnetIds: pulumi.Output<string[]>
  readonly internetGatewayId: pulumi.Output<string>
  readonly natGatewayId: pulumi.Output<string>

  constructor(name: string, args: NetworkArgs, opts?: pulumi.ComponentResourceOptions) {
    super(VPC_NETWORK_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const vpcName = resourceName(config, ResourceNameSuffix.VPC)

    const vpc = new awsx.ec2.Vpc(
      vpcName,
      {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        numberOfAvailabilityZones: config.availabilityZoneCount,
        natGateways: {
          strategy: config.singleNatGateway ? awsx.ec2.NatGatewayStrategy.Single : awsx.ec2.NatGatewayStrategy.OnePerAz
        },
        subnetStrategy: awsx.ec2.SubnetAllocationStrategy.Auto,
        subnetSpecs: [
          {
            name: 'public',
            type: awsx.ec2.SubnetType.Public,
            tags: createTags(config, {
              [KUBERNETES_PUBLIC_LOAD_BALANCER_SUBNET_ROLE_TAG]: KUBERNETES_SUBNET_ROLE_TAG_ENABLED_VALUE
            })
          },
          {
            name: 'private',
            type: awsx.ec2.SubnetType.Private,
            tags: createTags(config, {
              [KUBERNETES_INTERNAL_LOAD_BALANCER_SUBNET_ROLE_TAG]: KUBERNETES_SUBNET_ROLE_TAG_ENABLED_VALUE
            })
          }
        ],
        tags: createTags(config, {
          Name: vpcName
        })
      },
      { parent: this }
    )

    this.vpcId = vpc.vpcId
    this.publicSubnetIds = vpc.publicSubnetIds
    this.privateSubnetIds = vpc.privateSubnetIds
    this.internetGatewayId = vpc.internetGateway.apply((internetGateway) => internetGateway.id)
    this.natGatewayId = vpc.natGateways.apply((natGateways) => natGateways[0]?.id ?? '')

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      internetGatewayId: this.internetGatewayId,
      natGatewayId: this.natGatewayId
    })
  }
}
