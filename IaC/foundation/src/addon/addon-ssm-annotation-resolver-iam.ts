import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type SsmAnnotationResolverIamResources = {
  policyArn: pulumi.Output<string>
  policyName: pulumi.Output<string>
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type SsmAnnotationResolverIamArgs = {
  config: InfrastructureConfig
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
}

const SSM_ANNOTATION_RESOLVER_IAM_COMPONENT_TYPE = 'boilerplate:addon:SsmAnnotationResolverIam'
const SERVICE_ACCOUNT_NAME = 'ssm-annotation-resolver'
const SERVICE_ACCOUNT_NAMESPACE = 'envoy-gateway-system'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'

export class SsmAnnotationResolverIam extends pulumi.ComponentResource implements SsmAnnotationResolverIamResources {
  readonly policyArn: pulumi.Output<string>
  readonly policyName: pulumi.Output<string>
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: SsmAnnotationResolverIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(SSM_ANNOTATION_RESOLVER_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, oidcProviderArn, oidcProviderUrl } = args
    const policyName = resourceName(config, resourceNameSuffix.addon.ssmAnnotationResolver.policy)
    const roleName = resourceName(config, resourceNameSuffix.addon.ssmAnnotationResolver.role)
    const serviceAccountSubject = `system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}`
    const oidcProviderConditionKey = pulumi
      .output(oidcProviderUrl)
      .apply((url) => url.replace(HTTPS_PROTOCOL_PREFIX, ''))
    const callerIdentity = aws.getCallerIdentityOutput({})
    const queueNamePrefix = resourceName(config, 'ssm-annotation-resolver')
    const queueArnPrefix = pulumi.interpolate`arn:aws:sqs:${config.awsRegion}:${callerIdentity.accountId}:${queueNamePrefix}`
    const parameterArnPrefix = pulumi.interpolate`arn:aws:ssm:${config.awsRegion}:${callerIdentity.accountId}:parameter/${config.projectName}/${config.environment}/*`

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

    const policyDocument = pulumi.all([queueArnPrefix, parameterArnPrefix]).apply(([queueArnBase, ssmParameterArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            Resource: ssmParameterArn
          },
          {
            Effect: 'Allow',
            Action: ['sqs:CreateQueue'],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: ['sqs:GetQueueAttributes', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
            Resource: [`${queueArnBase}-queue`, `${queueArnBase}-dlq`]
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
      resourceName(config, resourceNameSuffix.addon.ssmAnnotationResolver.policyAttachment),
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
