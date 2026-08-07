// Copyright 2026 Boilerplate Authors
// SPDX-License-Identifier: Apache-2.0

import * as aws from '@pulumi/aws'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import * as path from 'path'

import { InfrastructureConfig } from '../config'
import { createTags } from '../tags'

export interface SsmAnnotationResolverArgs {
  config: InfrastructureConfig
  eksOidcProvider: { oidcProviderArn: pulumi.Output<string> }
  ssmParameterName: pulumi.Input<string>
  workloadK8sProvider: { provider: k8s.Provider }
  namespace?: string
}

interface SsmAnnotationResolverInfraOutputs {
  sqsQueueUrl?: string
  sqsQueueArn?: string
  dlqQueueUrl?: string
  dlqQueueArn?: string
  iamRoleArn?: string
}

interface SsmAnnotationResolverInfraStatus {
  phase?: string
  outputs?: SsmAnnotationResolverInfraOutputs
}

const DEFAULT_NAMESPACE = 'envoy-gateway-system'
const DEFAULT_SERVICE_ACCOUNT_NAME = 'ssm-annotation-resolver'
const SSM_INFRA_CRD_FILE_PATH = path.resolve(
  __dirname,
  '../../../../gitops/addons/ssm-annotation-resolver-crd/ssminfra-crd.yaml'
)

function requireStatusField(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`SsmAnnotationResolverInfra status.outputs.${fieldName} is missing after the resource became Ready`)
  }

  return value
}

/**
 * SsmAnnotationResolver creates a Kubernetes CustomResource that instructs
 * the SSM Annotation Resolver controller to provision Kubernetes-adjacent AWS infrastructure:
 * - SQS Queue + DLQ for SSM Parameter Store change events
 * - IAM Role for IRSA (IAM Roles for Service Accounts)
 *
 * Foundation then uses the Ready status outputs to finish the integration by
 * creating the EventBridge rule, target, and SQS queue policy.
 *
 * The controller observes this CRD and:
 * 1. Creates the SQS queues with proper redrive policy
 * 2. Creates the IAM role with OIDC trust relationship
 * 3. Updates the CRD status with outputs (sqsQueueUrl, iamRoleArn, etc.)
 *
 * Foundation then:
 * 4. Waits until status.phase == Ready
 * 5. Creates the EventBridge rule/target that sends Parameter Store change events to SQS
 * 6. Attaches the SQS queue policy that allows EventBridge to publish
 *
 * Usage:
 *   const ssmResolver = new SsmAnnotationResolver('ssm-resolver', {
 *     config,
 *     eksOidcProvider,
 *     ssmParameterName,
 *     workloadK8sProvider
 *   })
 *
 *   // Use outputs to configure Helm chart
 *   helmChart.values.sqs.queueURL = ssmResolver.sqsQueueUrl
 *   helmChart.values.irsa.roleArn = ssmResolver.iamRoleArn
 */
export class SsmAnnotationResolver extends pulumi.ComponentResource {
  public readonly crd: k8s.apiextensions.CustomResource
  public readonly sqsQueueUrl: pulumi.Output<string>
  public readonly sqsQueueArn: pulumi.Output<string>
  public readonly dlqQueueUrl: pulumi.Output<string>
  public readonly dlqQueueArn: pulumi.Output<string>
  public readonly iamRoleArn: pulumi.Output<string>
  public readonly serviceAccountName: string
  public readonly serviceAccountNamespace: string
  public readonly eventBridgeRuleArn: pulumi.Output<string>

  constructor(name: string, args: SsmAnnotationResolverArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:addon:SsmAnnotationResolver', name, {}, opts)

    const namespace = args.namespace || DEFAULT_NAMESPACE
    const serviceAccountName = DEFAULT_SERVICE_ACCOUNT_NAME
    const eventBridgeRuleName = `${name}-rule`
    const crdDefinition = new k8s.yaml.ConfigFile(
      `${name}-crd-definition`,
      {
        file: SSM_INFRA_CRD_FILE_PATH
      },
      {
        provider: args.workloadK8sProvider.provider,
        parent: this
      }
    )

    // Create the SsmAnnotationResolverInfra CRD instance
    // The SSM Annotation Resolver controller will watch this resource
    // and provision the SQS/DLQ/IAM resources automatically.
    this.crd = new k8s.apiextensions.CustomResource(
      `${name}-crd`,
      {
        apiVersion: 'ssm-annotation-resolver.io/v1',
        kind: 'SsmAnnotationResolverInfra',
        metadata: {
          name: 'default',
          namespace,
          annotations: {
            'pulumi.com/waitFor': 'jsonpath={.status.phase}=Ready'
          }
        },
        spec: {
          sqsQueueName: `${name}-queue`,
          dlqQueueName: `${name}-dlq`,
          eventBridgeRuleName,
          iamRoleName: `${name}-role`,
          awsRegion: args.config.awsRegion,
          oidcProviderArn: args.eksOidcProvider.oidcProviderArn,
          serviceAccountName
        }
      },
      {
        provider: args.workloadK8sProvider.provider,
        parent: this,
        dependsOn: [crdDefinition]
      }
    )

    const crdStatus = (
      this.crd as k8s.apiextensions.CustomResource & { status: pulumi.Output<SsmAnnotationResolverInfraStatus> }
    ).status

    const infraOutputs = crdStatus.apply((status) => {
      if (!status?.outputs) {
        throw new Error('SsmAnnotationResolverInfra did not publish status.outputs after becoming Ready')
      }

      return status.outputs
    })

    this.sqsQueueUrl = infraOutputs.apply((outputs) => requireStatusField(outputs.sqsQueueUrl, 'sqsQueueUrl'))
    this.sqsQueueArn = infraOutputs.apply((outputs) => requireStatusField(outputs.sqsQueueArn, 'sqsQueueArn'))
    this.dlqQueueUrl = infraOutputs.apply((outputs) => requireStatusField(outputs.dlqQueueUrl, 'dlqQueueUrl'))
    this.dlqQueueArn = infraOutputs.apply((outputs) => requireStatusField(outputs.dlqQueueArn, 'dlqQueueArn'))
    this.iamRoleArn = infraOutputs.apply((outputs) => requireStatusField(outputs.iamRoleArn, 'iamRoleArn'))
    this.serviceAccountName = serviceAccountName
    this.serviceAccountNamespace = namespace

    const eventBridgeRule = new aws.cloudwatch.EventRule(
      `${name}-eventbridge-rule`,
      {
        name: eventBridgeRuleName,
        description: `Routes SSM parameter change events for ${name} to the SSM Annotation Resolver queue`,
        eventPattern: pulumi.output(args.ssmParameterName).apply((ssmParameterName) =>
          JSON.stringify({
            source: ['aws.ssm'],
            'detail-type': ['Parameter Store Change'],
            detail: {
              name: [ssmParameterName],
              operation: ['Create', 'Update', 'Delete', 'LabelParameterVersion']
            }
          })
        ),
        tags: createTags(args.config, {
          Name: eventBridgeRuleName
        })
      },
      { parent: this, dependsOn: [this.crd] }
    )

    new aws.cloudwatch.EventTarget(
      `${name}-eventbridge-target`,
      {
        rule: eventBridgeRule.name,
        targetId: `${name}-sqs`,
        arn: this.sqsQueueArn
      },
      { parent: eventBridgeRule }
    )

    const queuePolicy = aws.iam.getPolicyDocumentOutput({
      statements: [
        {
          sid: 'AllowEventBridgeToSendMessages',
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: ['events.amazonaws.com']
            }
          ],
          actions: ['sqs:SendMessage'],
          resources: [this.sqsQueueArn],
          conditions: [
            {
              test: 'ArnEquals',
              variable: 'aws:SourceArn',
              values: [eventBridgeRule.arn]
            }
          ]
        }
      ]
    })

    new aws.sqs.QueuePolicy(
      `${name}-queue-policy`,
      {
        queueUrl: this.sqsQueueUrl,
        policy: queuePolicy.apply((document) => document.json)
      },
      { parent: this, dependsOn: [eventBridgeRule] }
    )

    this.eventBridgeRuleArn = eventBridgeRule.arn

    this.registerOutputs({
      crdDefinition,
      crd: this.crd,
      sqsQueueUrl: this.sqsQueueUrl,
      sqsQueueArn: this.sqsQueueArn,
      dlqQueueUrl: this.dlqQueueUrl,
      dlqQueueArn: this.dlqQueueArn,
      iamRoleArn: this.iamRoleArn,
      serviceAccountName: this.serviceAccountName,
      serviceAccountNamespace: this.serviceAccountNamespace,
      eventBridgeRuleArn: this.eventBridgeRuleArn
    })
  }
}
