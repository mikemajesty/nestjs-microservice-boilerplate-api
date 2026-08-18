import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationRedisResources = {
  redisAddress: pulumi.Output<string>
  redisArn: pulumi.Output<string>
  redisAuthToken: pulumi.Output<string>
  redisPort: pulumi.Output<number>
}

export type ApplicationRedisArgs = {
  config: InfrastructureConfig
  subnetGroupName: pulumi.Input<string>
  securityGroupId: pulumi.Input<string>
}

const APPLICATION_REDIS_COMPONENT_TYPE = 'boilerplate:app:Redis'
const REDIS_PORT = 6379
const ENGINE = 'redis'

export class ApplicationRedis extends pulumi.ComponentResource implements ApplicationRedisResources {
  readonly redisAddress: pulumi.Output<string>
  readonly redisArn: pulumi.Output<string>
  readonly redisAuthToken: pulumi.Output<string>
  readonly redisPort: pulumi.Output<number>

  constructor(name: string, args: ApplicationRedisArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_REDIS_COMPONENT_TYPE, name, {}, opts)

    const { config, subnetGroupName, securityGroupId } = args
    const redisName = resourceName(config, resourceNameSuffix.app.redis)
    const redisAuthTokenName = resourceName(config, resourceNameSuffix.app.redisAuthToken)

    const redisAuthToken = new random.RandomPassword(
      redisAuthTokenName,
      {
        length: 32,
        special: false
      },
      { parent: this }
    )

    const redis = new aws.elasticache.ReplicationGroup(
      redisName,
      {
        replicationGroupId: redisName,
        description: redisName,
        engine: ENGINE,
        engineVersion: config.appRedisEngineVersion,
        nodeType: config.appRedisNodeType,
        numCacheClusters: 1,
        parameterGroupName: 'default.redis7',
        port: config.appRedisPort ?? REDIS_PORT,
        subnetGroupName,
        securityGroupIds: [securityGroupId],
        applyImmediately: true,
        atRestEncryptionEnabled: true,
        automaticFailoverEnabled: false,
        multiAzEnabled: false,
        snapshotRetentionLimit: 0,
        transitEncryptionEnabled: true,
        authToken: pulumi.secret(redisAuthToken.result),
        tags: createTags(config, {
          Name: redisName
        })
      },
      { parent: this, dependsOn: [redisAuthToken] }
    )

    this.redisAddress = redis.primaryEndpointAddress
    this.redisArn = redis.arn
    this.redisAuthToken = redisAuthToken.result
    this.redisPort = pulumi.output(config.appRedisPort ?? REDIS_PORT)

    this.registerOutputs({
      redisAddress: this.redisAddress,
      redisArn: this.redisArn,
      redisAuthToken: this.redisAuthToken,
      redisPort: this.redisPort
    })
  }
}
