import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationRedisSecurityGroupResources = {
  redisSecurityGroupId: pulumi.Output<string>
}

export type ApplicationRedisSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
  clusterSecurityGroupId: pulumi.Input<string>
  karpenterNodeSecurityGroupId: pulumi.Input<string>
}

const APPLICATION_REDIS_SECURITY_GROUP_COMPONENT_TYPE = 'boilerplate:app:RedisSecurityGroup'
const REDIS_PORT = 6379
const TCP_PROTOCOL = 'tcp'

export class ApplicationRedisSecurityGroup
  extends pulumi.ComponentResource
  implements ApplicationRedisSecurityGroupResources
{
  readonly redisSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: ApplicationRedisSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_REDIS_SECURITY_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId, clusterSecurityGroupId, karpenterNodeSecurityGroupId } = args
    const redisSecurityGroupName = resourceName(config, resourceNameSuffix.app.redisSecurityGroup)

    const redisSecurityGroup = new aws.ec2.SecurityGroup(
      redisSecurityGroupName,
      {
        vpcId,
        ingress: [],
        egress: [],
        tags: createTags(config, {
          Name: redisSecurityGroupName
        })
      },
      { parent: this }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-redis-from-cluster-ingress'),
      {
        securityGroupId: redisSecurityGroup.id,
        referencedSecurityGroupId: clusterSecurityGroupId,
        fromPort: REDIS_PORT,
        toPort: REDIS_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow Redis traffic from the EKS cluster security group'
      },
      { parent: redisSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-redis-from-karpenter-ingress'),
      {
        securityGroupId: redisSecurityGroup.id,
        referencedSecurityGroupId: karpenterNodeSecurityGroupId,
        fromPort: REDIS_PORT,
        toPort: REDIS_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow Redis traffic from the Karpenter node security group'
      },
      { parent: redisSecurityGroup }
    )

    this.redisSecurityGroupId = redisSecurityGroup.id

    this.registerOutputs({
      redisSecurityGroupId: this.redisSecurityGroupId
    })
  }
}
