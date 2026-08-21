import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EbsCsiIamResources = {
  policyArn: pulumi.Output<string>
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type EbsCsiIamArgs = {
  config: InfrastructureConfig
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
}

const EBS_CSI_IAM_COMPONENT_TYPE = 'boilerplate:addon:EbsCsiIam'
const SERVICE_ACCOUNT_NAME = 'ebs-csi-controller-sa'
const SERVICE_ACCOUNT_NAMESPACE = 'kube-system'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'
const AMAZON_EBS_CSI_DRIVER_POLICY_ARN = 'arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy'

export class EbsCsiIam extends pulumi.ComponentResource implements EbsCsiIamResources {
  readonly policyArn: pulumi.Output<string>
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: EbsCsiIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EBS_CSI_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, oidcProviderArn, oidcProviderUrl } = args
    const roleName = resourceName(config, resourceNameSuffix.addon.ebsCsi.role)
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
      resourceName(config, resourceNameSuffix.addon.ebsCsi.policyAttachment),
      {
        role: role.name,
        policyArn: AMAZON_EBS_CSI_DRIVER_POLICY_ARN
      },
      { parent: role }
    )

    this.policyArn = pulumi.output(AMAZON_EBS_CSI_DRIVER_POLICY_ARN)
    this.roleArn = role.arn
    this.roleName = role.name

    this.registerOutputs({
      policyArn: this.policyArn,
      roleArn: this.roleArn,
      roleName: this.roleName,
      serviceAccountName: this.serviceAccountName,
      serviceAccountNamespace: this.serviceAccountNamespace
    })
  }
}
