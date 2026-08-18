import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationMongoResources = {
  mongoAddress: pulumi.Output<string>
  mongoArn: pulumi.Output<string>
  mongoDatabaseName: pulumi.Output<string>
  mongoPassword: pulumi.Output<string>
  mongoPort: pulumi.Output<number>
  mongoUsername: pulumi.Output<string>
}

export type ApplicationMongoArgs = {
  config: InfrastructureConfig
  subnetGroupName: pulumi.Input<string>
  securityGroupId: pulumi.Input<string>
  parameterGroupName: pulumi.Input<string>
}

const APPLICATION_MONGO_COMPONENT_TYPE = 'boilerplate:app:Mongo'
const MONGO_PORT = 27017
const MONGO_INSTANCE_COUNT = 1

export class ApplicationMongo extends pulumi.ComponentResource implements ApplicationMongoResources {
  readonly mongoAddress: pulumi.Output<string>
  readonly mongoArn: pulumi.Output<string>
  readonly mongoDatabaseName: pulumi.Output<string>
  readonly mongoPassword: pulumi.Output<string>
  readonly mongoPort: pulumi.Output<number>
  readonly mongoUsername: pulumi.Output<string>

  constructor(name: string, args: ApplicationMongoArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_MONGO_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetGroupName, securityGroupId, parameterGroupName } = args
    const mongoName = resourceName(config, resourceNameSuffix.app.mongo)
    const mongoPasswordName = resourceName(config, resourceNameSuffix.app.mongoPassword)

    const mongoPassword = new random.RandomPassword(
      mongoPasswordName,
      {
        length: 32,
        special: false
      },
      { parent: this }
    )

    const mongoCluster = new aws.docdb.Cluster(
      mongoName,
      {
        clusterIdentifier: mongoName,
        engine: 'docdb',
        engineVersion: config.appMongoEngineVersion,
        masterUsername: config.appMongoUsername,
        masterPassword: pulumi.secret(mongoPassword.result),
        port: config.appMongoPort ?? MONGO_PORT,
        dbSubnetGroupName: subnetGroupName,
        dbClusterParameterGroupName: parameterGroupName,
        vpcSecurityGroupIds: [securityGroupId],
        backupRetentionPeriod: 1,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: false,
        applyImmediately: true,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        tags: createTags(config, {
          Name: mongoName
        })
      },
      { parent: this, dependsOn: [mongoPassword], ignoreChanges: ['availabilityZones'] }
    )

    for (let index = 0; index < MONGO_INSTANCE_COUNT; index += 1) {
      new aws.docdb.ClusterInstance(
        resourceName(config, `${resourceNameSuffix.app.mongoInstance}-${index + 1}`),
        {
          identifier: `${mongoName}-${index + 1}`,
          clusterIdentifier: mongoCluster.clusterIdentifier,
          instanceClass: config.appMongoInstanceClass,
          applyImmediately: true,
          autoMinorVersionUpgrade: true
        },
        { parent: mongoCluster }
      )
    }

    this.mongoAddress = mongoCluster.endpoint
    this.mongoArn = mongoCluster.arn
    this.mongoDatabaseName = pulumi.output(config.appMongoDatabase)
    this.mongoPassword = mongoPassword.result
    this.mongoPort = pulumi.output(config.appMongoPort ?? MONGO_PORT)
    this.mongoUsername = pulumi.output(config.appMongoUsername)

    this.registerOutputs({
      mongoAddress: this.mongoAddress,
      mongoArn: this.mongoArn,
      mongoDatabaseName: this.mongoDatabaseName,
      mongoPassword: this.mongoPassword,
      mongoPort: this.mongoPort,
      mongoUsername: this.mongoUsername
    })
  }
}
