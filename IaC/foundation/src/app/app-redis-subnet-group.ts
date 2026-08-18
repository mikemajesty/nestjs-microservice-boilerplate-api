import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationRedisSubnetGroupResources = {
  redisSubnetGroupName: pulumi.Output<string>
}

export type ApplicationRedisSubnetGroupArgs = {
  config: InfrastructureConfig
  subnetIds: pulumi.Input<pulumi.Input<string>[]>
}

const APPLICATION_REDIS_SUBNET_GROUP_COMPONENT_TYPE = 'boilerplate:app:RedisSubnetGroup'

export class ApplicationRedisSubnetGroup
  extends pulumi.ComponentResource
  implements ApplicationRedisSubnetGroupResources
{
  readonly redisSubnetGroupName: pulumi.Output<string>

  constructor(name: string, args: ApplicationRedisSubnetGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_REDIS_SUBNET_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetIds } = args
    const redisSubnetGroupName = resourceName(config, resourceNameSuffix.app.redisSubnetGroup)

    const redisSubnetGroup = new aws.elasticache.SubnetGroup(
      redisSubnetGroupName,
      {
        subnetIds,
        tags: createTags(config, {
          Name: redisSubnetGroupName
        })
      },
      { parent: this }
    )

    this.redisSubnetGroupName = redisSubnetGroup.name

    this.registerOutputs({
      redisSubnetGroupName: this.redisSubnetGroupName
    })
  }
}
