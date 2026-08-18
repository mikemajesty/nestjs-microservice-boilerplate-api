import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationPostgresResources = {
  postgresAddress: pulumi.Output<string>
  postgresArn: pulumi.Output<string>
  postgresDatabaseName: pulumi.Output<string>
  postgresPassword: pulumi.Output<string>
  postgresPort: pulumi.Output<number>
  postgresUsername: pulumi.Output<string>
}

export type ApplicationPostgresArgs = {
  config: InfrastructureConfig
  subnetGroupName: pulumi.Input<string>
  securityGroupId: pulumi.Input<string>
}

const APPLICATION_POSTGRES_COMPONENT_TYPE = 'boilerplate:app:Postgres'
const BACKUP_RETENTION_PERIOD = 1
const ENGINE = 'postgres'
const STORAGE_TYPE = 'gp3'

export class ApplicationPostgres extends pulumi.ComponentResource implements ApplicationPostgresResources {
  readonly postgresAddress: pulumi.Output<string>
  readonly postgresArn: pulumi.Output<string>
  readonly postgresDatabaseName: pulumi.Output<string>
  readonly postgresPassword: pulumi.Output<string>
  readonly postgresPort: pulumi.Output<number>
  readonly postgresUsername: pulumi.Output<string>

  constructor(name: string, args: ApplicationPostgresArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_POSTGRES_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetGroupName, securityGroupId } = args
    const postgresName = resourceName(config, resourceNameSuffix.app.postgres)
    const postgresPasswordName = resourceName(config, resourceNameSuffix.app.postgresPassword)

    const postgresPassword = new random.RandomPassword(
      postgresPasswordName,
      {
        length: 32,
        special: false
      },
      { parent: this }
    )

    const postgres = new aws.rds.Instance(
      postgresName,
      {
        allocatedStorage: config.appPostgresAllocatedStorage,
        applyImmediately: true,
        backupRetentionPeriod: BACKUP_RETENTION_PERIOD,
        dbName: config.appPostgresDatabase,
        dbSubnetGroupName: subnetGroupName,
        deletionProtection: false,
        engine: ENGINE,
        instanceClass: config.appPostgresInstanceClass,
        autoMinorVersionUpgrade: true,
        publiclyAccessible: false,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        storageType: STORAGE_TYPE,
        username: config.appPostgresUsername,
        password: pulumi.secret(postgresPassword.result),
        vpcSecurityGroupIds: [securityGroupId],
        tags: createTags(config, {
          Name: postgresName
        })
      },
      { parent: this, dependsOn: [postgresPassword] }
    )

    this.postgresAddress = postgres.address
    this.postgresArn = postgres.arn
    this.postgresDatabaseName = postgres.dbName
    this.postgresPassword = postgresPassword.result
    this.postgresPort = postgres.port
    this.postgresUsername = postgres.username

    this.registerOutputs({
      postgresAddress: this.postgresAddress,
      postgresArn: this.postgresArn,
      postgresDatabaseName: this.postgresDatabaseName,
      postgresPassword: this.postgresPassword,
      postgresPort: this.postgresPort,
      postgresUsername: this.postgresUsername
    })
  }
}
