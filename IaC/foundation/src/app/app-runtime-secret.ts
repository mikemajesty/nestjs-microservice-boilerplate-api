import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'
import * as random from '@pulumi/random'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'
import type { ApplicationMongoResources } from './app-mongo'
import type { ApplicationPostgresResources } from './app-postgres'
import type { ApplicationRedisResources } from './app-redis'

export type ApplicationRuntimeSecretResources = {
  secretArn: pulumi.Output<string>
  secretName: pulumi.Output<string>
}

export type ApplicationRuntimeSecretArgs = {
  config: InfrastructureConfig
  mongo: ApplicationMongoResources
  postgres: ApplicationPostgresResources
  redis: ApplicationRedisResources
}

const APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE = 'boilerplate:app:RuntimeSecret'

export class ApplicationRuntimeSecret extends pulumi.ComponentResource implements ApplicationRuntimeSecretResources {
  readonly secretArn: pulumi.Output<string>
  readonly secretName: pulumi.Output<string>

  constructor(name: string, args: ApplicationRuntimeSecretArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE, name, {}, opts)

    const { config, mongo, postgres, redis } = args
    const secretResourceName = resourceName(config, resourceNameSuffix.app.runtimeSecret)
    const secretName = `${config.projectName}/${config.environment}/app`
    const mongoPort = mongo.mongoPort.apply((value) => String(value))
    const postgresUrl = pulumi.interpolate`postgresql://${postgres.postgresUsername}:${postgres.postgresPassword}@${postgres.postgresAddress}:${postgres.postgresPort}/${postgres.postgresDatabaseName}?sslmode=require`
    const mongoUrl = pulumi.interpolate`mongodb://${mongo.mongoUsername}:${mongo.mongoPassword}@${mongo.mongoAddress}:${mongoPort}/${mongo.mongoDatabaseName}?tls=true&tlsAllowInvalidCertificates=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false&authSource=admin`
    const mongoExpressUrl = pulumi.interpolate`https://${mongo.mongoAddress}`
    const redisUrl = pulumi.interpolate`rediss://:${redis.redisAuthToken}@${redis.redisAddress}:${redis.redisPort}/0`
    const postgresPort = postgres.postgresPort.apply((value) => String(value))
    const redisPort = redis.redisPort.apply((value) => String(value))

    // Generate random JWT secrets (64 chars, with special characters)
    const jwtSecretKey = new random.RandomPassword(
      resourceName(config, 'jwt-secret'),
      {
        length: 64,
        special: true,
        overrideSpecial: '!&#$^<>-'
      },
      { parent: this }
    )

    const jwtRefreshSecretKey = new random.RandomPassword(
      resourceName(config, 'jwt-refresh-secret'),
      {
        length: 64,
        special: true,
        overrideSpecial: '!&#$^<>-'
      },
      { parent: this }
    )

    // Generate random email credentials
    const emailUser = new random.RandomPassword(
      resourceName(config, 'email-user'),
      {
        length: 24,
        special: false
      },
      { parent: this }
    )

    const emailPass = new random.RandomPassword(
      resourceName(config, 'email-pass'),
      {
        length: 32,
        special: true,
        overrideSpecial: '!&#$^<>-'
      },
      { parent: this }
    )

    // Generate random Google OAuth credentials
    const googleClientId = new random.RandomPassword(
      resourceName(config, 'google-client-id'),
      {
        length: 48,
        special: false
      },
      { parent: this }
    )

    const googleClientSecret = new random.RandomPassword(
      resourceName(config, 'google-client-secret'),
      {
        length: 48,
        special: true,
        overrideSpecial: '!&#$^<>-'
      },
      { parent: this }
    )

    const secretValue = pulumi
      .all([
        mongo.mongoAddress,
        mongo.mongoDatabaseName,
        mongo.mongoPassword,
        mongo.mongoUsername,
        mongoPort,
        mongoUrl,
        mongoExpressUrl,
        postgres.postgresAddress,
        postgres.postgresDatabaseName,
        postgres.postgresPassword,
        postgresPort,
        postgres.postgresUsername,
        postgresUrl,
        redis.redisAddress,
        redis.redisAuthToken,
        redisPort,
        redisUrl,
        jwtSecretKey.result,
        jwtRefreshSecretKey.result,
        emailUser.result,
        emailPass.result,
        googleClientId.result,
        googleClientSecret.result
      ] as const)
      .apply(
        ([
          mongoHost,
          mongoDatabase,
          mongoPassword,
          mongoUsername,
          mongoPortValue,
          mongoConnectionUrl,
          mongoExpressConnectionUrl,
          host,
          database,
          password,
          port,
          username,
          url,
          redisHost,
          redisPassword,
          redisPortValue,
          redisConnectionUrl,
          jwtSecret,
          jwtRefreshSecret,
          emailUserValue,
          emailPassValue,
          googleClientIdValue,
          googleClientSecretValue
        ]) =>
          JSON.stringify({
            SMOKE_SECRET_MESSAGE: 'hello-from-secrets-manager',
            MONGO_URL: mongoConnectionUrl,
            MONGO_DATABASE: mongoDatabase,
            MONGO_EXPRESS_URL: mongoExpressConnectionUrl,
            MONGO_HOST: mongoHost,
            MONGO_PORT: mongoPortValue,
            MONGO_USER: mongoUsername,
            MONGO_PASSWORD: mongoPassword,
            POSTGRES_HOST: host,
            POSTGRES_PORT: port,
            POSTGRES_USER: username,
            POSTGRES_PASSWORD: password,
            POSTGRES_DATABASE: database,
            POSTGRES_URL: url,
            REDIS_HOST: redisHost,
            REDIS_PORT: redisPortValue,
            REDIS_PASSWORD: redisPassword,
            REDIS_URL: redisConnectionUrl,
            JWT_SECRET_KEY: jwtSecret,
            JWT_REFRESH_SECRET_KEY: jwtRefreshSecret,
            EMAIL_USER: emailUserValue,
            EMAIL_PASS: emailPassValue,
            GOOGLE_CLIENT_ID: googleClientIdValue,
            GOOGLE_CLIENT_SECRET: googleClientSecretValue
          })
      )

    const secret = new aws.secretsmanager.Secret(
      secretResourceName,
      {
        name: secretName,
        recoveryWindowInDays: 0,
        tags: createTags(config, {
          Name: secretResourceName
        })
      },
      { parent: this }
    )

    new aws.secretsmanager.SecretVersion(
      resourceName(config, resourceNameSuffix.app.runtimeSecretVersion),
      {
        secretId: secret.id,
        secretString: pulumi.secret(secretValue)
      },
      { parent: secret }
    )

    this.secretArn = secret.arn
    this.secretName = secret.name

    this.registerOutputs({
      secretArn: this.secretArn,
      secretName: this.secretName
    })
  }
}
