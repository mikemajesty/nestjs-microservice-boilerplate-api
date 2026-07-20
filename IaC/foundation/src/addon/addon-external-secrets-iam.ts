import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ExternalSecretsIamResources = {
  policyArn: pulumi.Output<string>
  policyName: pulumi.Output<string>
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type ExternalSecretsIamArgs = {
  config: InfrastructureConfig
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
  runtimeSecretArn: pulumi.Input<string>
}

const EXTERNAL_SECRETS_IAM_COMPONENT_TYPE = 'boilerplate:addon:ExternalSecretsIam'
const SERVICE_ACCOUNT_NAME = 'external-secrets'
const SERVICE_ACCOUNT_NAMESPACE = 'external-secrets'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'

export class ExternalSecretsIam extends pulumi.ComponentResource implements ExternalSecretsIamResources {
  readonly policyArn: pulumi.Output<string>
  readonly policyName: pulumi.Output<string>
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: ExternalSecretsIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EXTERNAL_SECRETS_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, oidcProviderArn, oidcProviderUrl, runtimeSecretArn } = args
    const policyName = resourceName(config, resourceNameSuffix.addon.externalSecrets.policy)
    const roleName = resourceName(config, resourceNameSuffix.addon.externalSecrets.role)
    const serviceAccountSubject = `system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}`
    const oidcProviderConditionKey = pulumi
      .output(oidcProviderUrl)
      .apply((url) => url.replace(HTTPS_PROTOCOL_PREFIX, ''))

    const assumeRolePolicy = pulumi
      .all([oidcProviderArn, oidcProviderConditionKey])
      .apply(([providerArn, providerUrl]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Federated: providerArn
              },
              Action: 'sts:AssumeRoleWithWebIdentity',
              Condition: {
                StringEquals: {
                  [`${providerUrl}:aud`]: STS_AUDIENCE,
                  [`${providerUrl}:sub`]: serviceAccountSubject
                }
              }
            }
          ]
        })
      )

    const policyDocument = pulumi.output(runtimeSecretArn).apply((secretArn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:DescribeSecret',
              'secretsmanager:GetSecretValue',
              'secretsmanager:ListSecretVersionIds'
            ],
            Resource: secretArn
          }
        ]
      })
    )

    const policy = new aws.iam.Policy(
      policyName,
      {
        name: policyName,
        policy: policyDocument,
        tags: createTags(config, {
          Name: policyName
        })
      },
      { parent: this }
    )

    const role = new aws.iam.Role(
      roleName,
      {
        name: roleName,
        assumeRolePolicy,
        tags: createTags(config, {
          Name: roleName
        })
      },
      { parent: this }
    )

    new aws.iam.RolePolicyAttachment(
      resourceName(config, resourceNameSuffix.addon.externalSecrets.policyAttachment),
      {
        role: role.name,
        policyArn: policy.arn
      },
      { parent: role }
    )

    this.policyArn = policy.arn
    this.policyName = policy.name
    this.roleArn = role.arn
    this.roleName = role.name

    this.registerOutputs({
      policyArn: this.policyArn,
      policyName: this.policyName,
      roleArn: this.roleArn,
      roleName: this.roleName,
      serviceAccountName: this.serviceAccountName,
      serviceAccountNamespace: this.serviceAccountNamespace
    })
  }
}
