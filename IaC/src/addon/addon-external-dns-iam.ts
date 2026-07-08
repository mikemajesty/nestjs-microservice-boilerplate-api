import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ExternalDnsIamResources = {
  policyArn: pulumi.Output<string>
  policyName: pulumi.Output<string>
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type ExternalDnsIamArgs = {
  config: InfrastructureConfig
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
  privateHostedZoneId: pulumi.Input<string>
}

const EXTERNAL_DNS_IAM_COMPONENT_TYPE = 'boilerplate:addon:ExternalDnsIam'
const SERVICE_ACCOUNT_NAME = 'external-dns'
const SERVICE_ACCOUNT_NAMESPACE = 'kube-system'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'

export class ExternalDnsIam extends pulumi.ComponentResource implements ExternalDnsIamResources {
  readonly policyArn: pulumi.Output<string>
  readonly policyName: pulumi.Output<string>
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: ExternalDnsIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EXTERNAL_DNS_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, oidcProviderArn, oidcProviderUrl, privateHostedZoneId } = args
    const policyName = resourceName(config, ResourceNameSuffix.EXTERNAL_DNS_POLICY)
    const roleName = resourceName(config, ResourceNameSuffix.EXTERNAL_DNS_ROLE)
    const serviceAccountSubject = `system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}`
    const oidcProviderConditionKey = pulumi
      .output(oidcProviderUrl)
      .apply((url) => url.replace(HTTPS_PROTOCOL_PREFIX, ''))
    const hostedZoneArn = pulumi.output(privateHostedZoneId).apply((zoneId) => `arn:aws:route53:::hostedzone/${zoneId}`)

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

    const policyDocument = pulumi.all([hostedZoneArn]).apply(([zoneArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['route53:ChangeResourceRecordSets'],
            Resource: zoneArn
          },
          {
            Effect: 'Allow',
            Action: ['route53:ListHostedZones', 'route53:ListHostedZonesByName'],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: ['route53:ListResourceRecordSets'],
            Resource: zoneArn
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
      resourceName(config, ResourceNameSuffix.EXTERNAL_DNS_POLICY_ATTACHMENT),
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
