import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationRuntimeSecretResources = {
  secretArn: pulumi.Output<string>
  secretName: pulumi.Output<string>
}

export type ApplicationRuntimeSecretArgs = {
  config: InfrastructureConfig
}

const APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE = 'boilerplate:app:RuntimeSecret'
const EXAMPLE_SECRET_VALUE = {
  SMOKE_SECRET_MESSAGE: 'hello-from-secrets-manager'
}

export class ApplicationRuntimeSecret extends pulumi.ComponentResource implements ApplicationRuntimeSecretResources {
  readonly secretArn: pulumi.Output<string>
  readonly secretName: pulumi.Output<string>

  constructor(name: string, args: ApplicationRuntimeSecretArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_RUNTIME_SECRET_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const secretResourceName = resourceName(config, resourceNameSuffix.app.runtimeSecret)
    const secretName = `${config.projectName}/${config.environment}/smoke-app`

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
        secretString: pulumi.secret(JSON.stringify(EXAMPLE_SECRET_VALUE))
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
