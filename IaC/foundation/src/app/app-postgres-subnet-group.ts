import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationPostgresSubnetGroupResources = {
  postgresSubnetGroupName: pulumi.Output<string>
}

export type ApplicationPostgresSubnetGroupArgs = {
  config: InfrastructureConfig
  subnetIds: pulumi.Input<pulumi.Input<string>[]>
}

const APPLICATION_POSTGRES_SUBNET_GROUP_COMPONENT_TYPE = 'boilerplate:app:PostgresSubnetGroup'

export class ApplicationPostgresSubnetGroup
  extends pulumi.ComponentResource
  implements ApplicationPostgresSubnetGroupResources
{
  readonly postgresSubnetGroupName: pulumi.Output<string>

  constructor(name: string, args: ApplicationPostgresSubnetGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_POSTGRES_SUBNET_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetIds } = args
    const postgresSubnetGroupName = resourceName(config, resourceNameSuffix.app.postgresSubnetGroup)

    const postgresSubnetGroup = new aws.rds.SubnetGroup(
      postgresSubnetGroupName,
      {
        subnetIds,
        tags: createTags(config, {
          Name: postgresSubnetGroupName
        })
      },
      { parent: this }
    )

    this.postgresSubnetGroupName = postgresSubnetGroup.name

    this.registerOutputs({
      postgresSubnetGroupName: this.postgresSubnetGroupName
    })
  }
}
