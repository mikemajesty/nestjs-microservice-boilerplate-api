import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type AwsLoadBalancerControllerIamResources = {
  policyArn: pulumi.Output<string>
  policyName: pulumi.Output<string>
  roleArn: pulumi.Output<string>
  roleName: pulumi.Output<string>
  serviceAccountName: string
  serviceAccountNamespace: string
}

export type AwsLoadBalancerControllerIamArgs = {
  config: InfrastructureConfig
  oidcProviderArn: pulumi.Input<string>
  oidcProviderUrl: pulumi.Input<string>
}

const AWS_LOAD_BALANCER_CONTROLLER_IAM_COMPONENT_TYPE = 'boilerplate:addon:AwsLoadBalancerControllerIam'
const SERVICE_ACCOUNT_NAME = 'aws-load-balancer-controller'
const SERVICE_ACCOUNT_NAMESPACE = 'kube-system'
const STS_AUDIENCE = 'sts.amazonaws.com'
const HTTPS_PROTOCOL_PREFIX = 'https://'

const AWS_LOAD_BALANCER_CONTROLLER_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['iam:CreateServiceLinkedRole'],
      Resource: '*',
      Condition: {
        StringEquals: {
          'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com'
        }
      }
    },
    {
      Effect: 'Allow',
      Action: [
        'ec2:DescribeAccountAttributes',
        'ec2:DescribeAddresses',
        'ec2:DescribeAvailabilityZones',
        'ec2:DescribeCoipPools',
        'ec2:DescribeCustomerGateways',
        'ec2:DescribeDhcpOptions',
        'ec2:DescribeInstances',
        'ec2:DescribeInternetGateways',
        'ec2:DescribeIpamPools',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DescribeRouteTables',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeSubnets',
        'ec2:DescribeTags',
        'ec2:DescribeVpcs',
        'ec2:DescribeVpcPeeringConnections',
        'elasticloadbalancing:DescribeListenerAttributes',
        'elasticloadbalancing:DescribeListenerCertificates',
        'elasticloadbalancing:DescribeListeners',
        'elasticloadbalancing:DescribeLoadBalancerAttributes',
        'elasticloadbalancing:DescribeLoadBalancers',
        'elasticloadbalancing:DescribeRules',
        'elasticloadbalancing:DescribeSSLPolicies',
        'elasticloadbalancing:DescribeTags',
        'elasticloadbalancing:DescribeTargetGroupAttributes',
        'elasticloadbalancing:DescribeTargetGroups',
        'elasticloadbalancing:DescribeTargetHealth'
      ],
      Resource: '*'
    },
    {
      Effect: 'Allow',
      Action: [
        'acm:DescribeCertificate',
        'acm:GetCertificate',
        'acm:ListCertificates',
        'cognito-idp:DescribeUserPoolClient',
        'shield:CreateProtection',
        'shield:DeleteProtection',
        'shield:DescribeProtection',
        'shield:GetSubscriptionState',
        'waf-regional:AssociateWebACL',
        'waf-regional:DisassociateWebACL',
        'waf-regional:GetWebACL',
        'waf-regional:GetWebACLForResource',
        'wafv2:AssociateWebACL',
        'wafv2:DisassociateWebACL',
        'wafv2:GetWebACL',
        'wafv2:GetWebACLForResource'
      ],
      Resource: '*'
    },
    {
      Effect: 'Allow',
      Action: [
        'ec2:AuthorizeSecurityGroupIngress',
        'ec2:CreateSecurityGroup',
        'ec2:DeleteSecurityGroup',
        'ec2:RevokeSecurityGroupIngress'
      ],
      Resource: '*'
    },
    {
      Effect: 'Allow',
      Action: ['ec2:CreateTags'],
      Resource: 'arn:aws:ec2:*:*:security-group/*',
      Condition: {
        StringEquals: {
          'ec2:CreateAction': 'CreateSecurityGroup'
        },
        Null: {
          'aws:RequestTag/elbv2.k8s.aws/cluster': 'false'
        }
      }
    },
    {
      Effect: 'Allow',
      Action: ['ec2:CreateTags', 'ec2:DeleteTags'],
      Resource: 'arn:aws:ec2:*:*:security-group/*',
      Condition: {
        Null: {
          'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
          'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false'
        }
      }
    },
    {
      Effect: 'Allow',
      Action: [
        'elasticloadbalancing:AddListenerCertificates',
        'elasticloadbalancing:AddTags',
        'elasticloadbalancing:CreateListener',
        'elasticloadbalancing:CreateLoadBalancer',
        'elasticloadbalancing:CreateRule',
        'elasticloadbalancing:CreateTargetGroup',
        'elasticloadbalancing:DeleteListener',
        'elasticloadbalancing:DeleteLoadBalancer',
        'elasticloadbalancing:DeleteRule',
        'elasticloadbalancing:DeleteTargetGroup',
        'elasticloadbalancing:DeregisterTargets',
        'elasticloadbalancing:ModifyListener',
        'elasticloadbalancing:ModifyLoadBalancerAttributes',
        'elasticloadbalancing:ModifyRule',
        'elasticloadbalancing:ModifyTargetGroup',
        'elasticloadbalancing:ModifyTargetGroupAttributes',
        'elasticloadbalancing:RegisterTargets',
        'elasticloadbalancing:RemoveListenerCertificates',
        'elasticloadbalancing:RemoveTags',
        'elasticloadbalancing:SetIpAddressType',
        'elasticloadbalancing:SetRulePriorities',
        'elasticloadbalancing:SetSecurityGroups',
        'elasticloadbalancing:SetSubnets',
        'elasticloadbalancing:SetWebAcl'
      ],
      Resource: '*'
    }
  ]
}

export class AwsLoadBalancerControllerIam
  extends pulumi.ComponentResource
  implements AwsLoadBalancerControllerIamResources
{
  readonly policyArn: pulumi.Output<string>
  readonly policyName: pulumi.Output<string>
  readonly roleArn: pulumi.Output<string>
  readonly roleName: pulumi.Output<string>
  readonly serviceAccountName = SERVICE_ACCOUNT_NAME
  readonly serviceAccountNamespace = SERVICE_ACCOUNT_NAMESPACE

  constructor(name: string, args: AwsLoadBalancerControllerIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(AWS_LOAD_BALANCER_CONTROLLER_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config, oidcProviderArn, oidcProviderUrl } = args
    const policyName = resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.policy)
    const roleName = resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.role)
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

    const policy = new aws.iam.Policy(
      policyName,
      {
        name: policyName,
        policy: JSON.stringify(AWS_LOAD_BALANCER_CONTROLLER_POLICY),
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
      resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.policyAttachment),
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
