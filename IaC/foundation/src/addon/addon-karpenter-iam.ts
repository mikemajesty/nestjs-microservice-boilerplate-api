import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type KarpenterIamResources = {
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type KarpenterIamArgs = {
  config: InfrastructureConfig
  clusterName: pulumi.Input<string>
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
  nodeRoleArn: pulumi.Input<string>
}

const KARPENTER_IAM_COMPONENT_TYPE = 'boilerplate:addon:KarpenterIam'
const SERVICE_ACCOUNT_NAME = 'karpenter'
const SERVICE_ACCOUNT_NAMESPACE = 'karpenter'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'

export class KarpenterIam extends pulumi.ComponentResource implements KarpenterIamResources {
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: KarpenterIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(KARPENTER_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterName, oidcProviderArn, oidcProviderUrl, nodeRoleArn } = args
    const roleName = resourceName(config, resourceNameSuffix.addon.karpenter.role)
    const serviceAccountSubject = `system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}`
    const oidcProviderConditionKey = pulumi
      .output(oidcProviderUrl)
      .apply((url) => url.replace(HTTPS_PROTOCOL_PREFIX, ''))
    const callerIdentity = aws.getCallerIdentityOutput({})
    const region = config.awsRegion

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

    const clusterArn = pulumi
      .all([callerIdentity.accountId, clusterName])
      .apply(([accountId, cluster]) => `arn:aws:eks:${region}:${accountId}:cluster/${cluster}`)

    const nodeLifecyclePolicy = new aws.iam.Policy(
      resourceName(config, resourceNameSuffix.addon.karpenter.nodeLifecyclePolicy),
      {
        name: resourceName(config, resourceNameSuffix.addon.karpenter.nodeLifecyclePolicy),
        policy: pulumi.all([clusterName]).apply(([cluster]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowScopedEC2InstanceAccessActions',
                Effect: 'Allow',
                Resource: [
                  `arn:aws:ec2:${region}::image/*`,
                  `arn:aws:ec2:${region}::snapshot/*`,
                  `arn:aws:ec2:${region}:*:security-group/*`,
                  `arn:aws:ec2:${region}:*:subnet/*`,
                  `arn:aws:ec2:${region}:*:capacity-reservation/*`,
                  `arn:aws:ec2:${region}:*:placement-group/*`
                ],
                Action: ['ec2:RunInstances', 'ec2:CreateFleet']
              },
              {
                Sid: 'AllowScopedEC2LaunchTemplateAccessActions',
                Effect: 'Allow',
                Resource: `arn:aws:ec2:${region}:*:launch-template/*`,
                Action: ['ec2:RunInstances', 'ec2:CreateFleet'],
                Condition: {
                  StringEquals: {
                    [`aws:ResourceTag/kubernetes.io/cluster/${cluster}`]: 'owned'
                  },
                  StringLike: {
                    'aws:ResourceTag/karpenter.sh/nodepool': '*'
                  }
                }
              },
              {
                Sid: 'AllowScopedEC2InstanceActionsWithTags',
                Effect: 'Allow',
                Resource: [
                  `arn:aws:ec2:${region}:*:fleet/*`,
                  `arn:aws:ec2:${region}:*:instance/*`,
                  `arn:aws:ec2:${region}:*:volume/*`,
                  `arn:aws:ec2:${region}:*:network-interface/*`,
                  `arn:aws:ec2:${region}:*:launch-template/*`,
                  `arn:aws:ec2:${region}:*:spot-instances-request/*`
                ],
                Action: ['ec2:RunInstances', 'ec2:CreateFleet', 'ec2:CreateLaunchTemplate'],
                Condition: {
                  StringEquals: {
                    [`aws:RequestTag/kubernetes.io/cluster/${cluster}`]: 'owned',
                    'aws:RequestTag/eks:eks-cluster-name': cluster
                  },
                  StringLike: {
                    'aws:RequestTag/karpenter.sh/nodepool': '*'
                  }
                }
              },
              {
                Sid: 'AllowScopedResourceCreationTagging',
                Effect: 'Allow',
                Resource: [
                  `arn:aws:ec2:${region}:*:fleet/*`,
                  `arn:aws:ec2:${region}:*:instance/*`,
                  `arn:aws:ec2:${region}:*:volume/*`,
                  `arn:aws:ec2:${region}:*:network-interface/*`,
                  `arn:aws:ec2:${region}:*:launch-template/*`,
                  `arn:aws:ec2:${region}:*:spot-instances-request/*`
                ],
                Action: 'ec2:CreateTags',
                Condition: {
                  StringEquals: {
                    [`aws:RequestTag/kubernetes.io/cluster/${cluster}`]: 'owned',
                    'aws:RequestTag/eks:eks-cluster-name': cluster,
                    'ec2:CreateAction': ['RunInstances', 'CreateFleet', 'CreateLaunchTemplate']
                  },
                  StringLike: {
                    'aws:RequestTag/karpenter.sh/nodepool': '*'
                  }
                }
              },
              {
                Sid: 'AllowScopedResourceTagging',
                Effect: 'Allow',
                Resource: `arn:aws:ec2:${region}:*:instance/*`,
                Action: 'ec2:CreateTags',
                Condition: {
                  StringEquals: {
                    [`aws:ResourceTag/kubernetes.io/cluster/${cluster}`]: 'owned'
                  },
                  StringLike: {
                    'aws:ResourceTag/karpenter.sh/nodepool': '*'
                  },
                  StringEqualsIfExists: {
                    'aws:RequestTag/eks:eks-cluster-name': cluster
                  },
                  'ForAllValues:StringEquals': {
                    'aws:TagKeys': ['eks:eks-cluster-name', 'karpenter.sh/nodeclaim', 'Name']
                  }
                }
              },
              {
                Sid: 'AllowScopedDeletion',
                Effect: 'Allow',
                Resource: [`arn:aws:ec2:${region}:*:instance/*`, `arn:aws:ec2:${region}:*:launch-template/*`],
                Action: ['ec2:TerminateInstances', 'ec2:DeleteLaunchTemplate'],
                Condition: {
                  StringEquals: {
                    [`aws:ResourceTag/kubernetes.io/cluster/${cluster}`]: 'owned'
                  },
                  StringLike: {
                    'aws:ResourceTag/karpenter.sh/nodepool': '*'
                  }
                }
              }
            ]
          })
        ),
        tags: createTags(config, {
          Name: resourceName(config, resourceNameSuffix.addon.karpenter.nodeLifecyclePolicy)
        })
      },
      { parent: this }
    )

    const iamIntegrationPolicy = new aws.iam.Policy(
      resourceName(config, resourceNameSuffix.addon.karpenter.iamIntegrationPolicy),
      {
        name: resourceName(config, resourceNameSuffix.addon.karpenter.iamIntegrationPolicy),
        policy: pulumi.all([nodeRoleArn, callerIdentity.accountId]).apply(([roleArn, accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowPassingInstanceRole',
                Effect: 'Allow',
                Resource: roleArn,
                Action: 'iam:PassRole',
                Condition: {
                  StringEquals: {
                    'iam:PassedToService': ['ec2.amazonaws.com', 'ec2.amazonaws.com.cn']
                  }
                }
              },
              {
                Sid: 'AllowScopedInstanceProfileCreationActions',
                Effect: 'Allow',
                Resource: `arn:aws:iam::${accountId}:instance-profile/*`,
                Action: ['iam:CreateInstanceProfile']
              },
              {
                Sid: 'AllowScopedInstanceProfileTagActions',
                Effect: 'Allow',
                Resource: `arn:aws:iam::${accountId}:instance-profile/*`,
                Action: ['iam:TagInstanceProfile']
              },
              {
                Sid: 'AllowScopedInstanceProfileActions',
                Effect: 'Allow',
                Resource: `arn:aws:iam::${accountId}:instance-profile/*`,
                Action: [
                  'iam:AddRoleToInstanceProfile',
                  'iam:RemoveRoleFromInstanceProfile',
                  'iam:DeleteInstanceProfile'
                ]
              },
              {
                Sid: 'AllowScopedInstanceProfileReadActions',
                Effect: 'Allow',
                Resource: `arn:aws:iam::${accountId}:instance-profile/*`,
                Action: 'iam:GetInstanceProfile'
              },
              {
                Sid: 'AllowAPIServerEndpointDiscovery',
                Effect: 'Allow',
                Resource: clusterArn,
                Action: 'eks:DescribeCluster'
              }
            ]
          })
        ),
        tags: createTags(config, {
          Name: resourceName(config, resourceNameSuffix.addon.karpenter.iamIntegrationPolicy)
        })
      },
      { parent: this }
    )

    const resourceDiscoveryPolicy = new aws.iam.Policy(
      resourceName(config, resourceNameSuffix.addon.karpenter.resourceDiscoveryPolicy),
      {
        name: resourceName(config, resourceNameSuffix.addon.karpenter.resourceDiscoveryPolicy),
        policy: pulumi.all([callerIdentity.accountId]).apply(([accountId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowRegionalReadActions',
                Effect: 'Allow',
                Resource: '*',
                Action: [
                  'ec2:DescribeCapacityReservations',
                  'ec2:DescribeImages',
                  'ec2:DescribeInstances',
                  'ec2:DescribeInstanceStatus',
                  'ec2:DescribeInstanceTypeOfferings',
                  'ec2:DescribeInstanceTypes',
                  'ec2:DescribeLaunchTemplates',
                  'ec2:DescribePlacementGroups',
                  'ec2:DescribeSecurityGroups',
                  'ec2:DescribeSpotPriceHistory',
                  'ec2:DescribeSubnets'
                ],
                Condition: {
                  StringEquals: {
                    'aws:RequestedRegion': region
                  }
                }
              },
              {
                Sid: 'AllowSSMReadActions',
                Effect: 'Allow',
                Resource: `arn:aws:ssm:${region}::parameter/aws/service/*`,
                Action: 'ssm:GetParameter'
              },
              {
                Sid: 'AllowPricingReadActions',
                Effect: 'Allow',
                Resource: '*',
                Action: 'pricing:GetProducts'
              },
              {
                Sid: 'AllowUnscopedInstanceProfileListAction',
                Effect: 'Allow',
                Resource: '*',
                Action: 'iam:ListInstanceProfiles'
              },
              {
                Sid: 'AllowInstanceProfileReadActions',
                Effect: 'Allow',
                Resource: `arn:aws:iam::${accountId}:instance-profile/*`,
                Action: 'iam:GetInstanceProfile'
              }
            ]
          })
        ),
        tags: createTags(config, {
          Name: resourceName(config, resourceNameSuffix.addon.karpenter.resourceDiscoveryPolicy)
        })
      },
      { parent: this }
    )

    const eksIntegrationPolicy = new aws.iam.Policy(
      resourceName(config, resourceNameSuffix.addon.karpenter.eksIntegrationPolicy),
      {
        name: resourceName(config, resourceNameSuffix.addon.karpenter.eksIntegrationPolicy),
        policy: pulumi.all([clusterArn]).apply(([arn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowAPIServerEndpointDiscovery',
                Effect: 'Allow',
                Resource: arn,
                Action: 'eks:DescribeCluster'
              }
            ]
          })
        ),
        tags: createTags(config, {
          Name: resourceName(config, resourceNameSuffix.addon.karpenter.eksIntegrationPolicy)
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
      `${resourceName(config, resourceNameSuffix.addon.karpenter.role)}-node-lifecycle`,
      { role: role.name, policyArn: nodeLifecyclePolicy.arn },
      { parent: role }
    )
    new aws.iam.RolePolicyAttachment(
      `${resourceName(config, resourceNameSuffix.addon.karpenter.role)}-iam-integration`,
      { role: role.name, policyArn: iamIntegrationPolicy.arn },
      { parent: role }
    )
    new aws.iam.RolePolicyAttachment(
      `${resourceName(config, resourceNameSuffix.addon.karpenter.role)}-resource-discovery`,
      { role: role.name, policyArn: resourceDiscoveryPolicy.arn },
      { parent: role }
    )
    new aws.iam.RolePolicyAttachment(
      `${resourceName(config, resourceNameSuffix.addon.karpenter.role)}-eks-integration`,
      { role: role.name, policyArn: eksIntegrationPolicy.arn },
      { parent: role }
    )

    this.roleArn = role.arn
    this.roleName = role.name

    this.registerOutputs({
      roleArn: this.roleArn,
      roleName: this.roleName,
      serviceAccountName: this.serviceAccountName,
      serviceAccountNamespace: this.serviceAccountNamespace
    })
  }
}
