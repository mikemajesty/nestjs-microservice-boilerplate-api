import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationMongoSubnetGroupResources = {
  mongoSubnetGroupName: pulumi.Output<string>
}

export type ApplicationMongoSubnetGroupArgs = {
  config: InfrastructureConfig
  subnetIds: pulumi.Input<pulumi.Input<string>[]>
}

const APPLICATION_MONGO_SUBNET_GROUP_COMPONENT_TYPE = 'boilerplate:app:MongoSubnetGroup'

export class ApplicationMongoSubnetGroup
  extends pulumi.ComponentResource
  implements ApplicationMongoSubnetGroupResources
{
  readonly mongoSubnetGroupName: pulumi.Output<string>

  constructor(name: string, args: ApplicationMongoSubnetGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_MONGO_SUBNET_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetIds } = args
    const mongoSubnetGroupName = resourceName(config, resourceNameSuffix.app.mongoSubnetGroup)

    const mongoSubnetGroup = new aws.docdb.SubnetGroup(
      mongoSubnetGroupName,
      {
        subnetIds,
        tags: createTags(config, {
          Name: mongoSubnetGroupName
        })
      },
      { parent: this }
    )

    this.mongoSubnetGroupName = mongoSubnetGroup.name

    this.registerOutputs({
      mongoSubnetGroupName: this.mongoSubnetGroupName
    })
  }
}
