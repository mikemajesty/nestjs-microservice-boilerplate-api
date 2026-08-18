import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationMongoParameterGroupResources = {
  mongoParameterGroupName: pulumi.Output<string>
}

export type ApplicationMongoParameterGroupArgs = {
  config: InfrastructureConfig
}

const APPLICATION_MONGO_PARAMETER_GROUP_COMPONENT_TYPE = 'boilerplate:app:MongoParameterGroup'
const MONGO_PARAMETER_GROUP_FAMILY = 'docdb5.0'

export class ApplicationMongoParameterGroup
  extends pulumi.ComponentResource
  implements ApplicationMongoParameterGroupResources
{
  readonly mongoParameterGroupName: pulumi.Output<string>

  constructor(name: string, args: ApplicationMongoParameterGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_MONGO_PARAMETER_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const mongoParameterGroupName = resourceName(config, resourceNameSuffix.app.mongoParameterGroup)

    const mongoParameterGroup = new aws.docdb.ClusterParameterGroup(
      mongoParameterGroupName,
      {
        family: MONGO_PARAMETER_GROUP_FAMILY,
        description: 'DocumentDB parameter group for the application',
        parameters: [
          {
            name: 'tls',
            value: 'enabled'
          }
        ],
        tags: createTags(config, {
          Name: mongoParameterGroupName
        })
      },
      { parent: this }
    )

    this.mongoParameterGroupName = mongoParameterGroup.name

    this.registerOutputs({
      mongoParameterGroupName: this.mongoParameterGroupName
    })
  }
}
