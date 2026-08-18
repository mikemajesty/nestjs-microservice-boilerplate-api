import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'
import type { ApplicationPostgresResources } from './app-postgres'

export type ApplicationRuntimeSecretResources = {
  secretArn: pulumi.Output<string>
  secretName: pulumi.Output<string>
}

export type ApplicationRuntimeSecretArgs = {
  config: InfrastructureConfig
  postgres: ApplicationPostgresResources
}

const APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE = 'boilerplate:app:RuntimeSecret'

export class ApplicationRuntimeSecret extends pulumi.ComponentResource implements ApplicationRuntimeSecretResources {
  readonly secretArn: pulumi.Output<string>
  readonly secretName: pulumi.Output<string>

  constructor(name: string, args: ApplicationRuntimeSecretArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE, name, {}, opts)

    const { config, postgres } = args
    const secretResourceName = resourceName(config, resourceNameSuffix.app.runtimeSecret)
    const secretName = `${config.projectName}/${config.environment}/smoke-app`
    const postgresUrl = pulumi.interpolate`postgresql://${postgres.postgresUsername}:${postgres.postgresPassword}@${postgres.postgresAddress}:${postgres.postgresPort}/${postgres.postgresDatabaseName}`
    const secretValue = pulumi
      .all([
        postgres.postgresAddress,
        postgres.postgresDatabaseName,
        postgres.postgresPassword,
        postgres.postgresPort,
        postgres.postgresUsername,
        postgresUrl
      ])
      .apply(([host, database, password, port, username, url]) =>
        JSON.stringify({
          SMOKE_SECRET_MESSAGE: 'hello-from-secrets-manager',
          POSTGRES_HOST: host,
          POSTGRES_PORT: String(port),
          POSTGRES_USER: username,
          POSTGRES_PASSWORD: password,
          POSTGRES_DATABASE: database,
          POSTGRES_URL: url
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
