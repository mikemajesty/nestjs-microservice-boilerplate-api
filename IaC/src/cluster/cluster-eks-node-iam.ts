import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EksNodeIamResources = {
  nodeRoleArn: pulumi.Output<string>
  nodeRoleName: pulumi.Output<string>
}

export type EksNodeIamArgs = {
  config: InfrastructureConfig
}

const EKS_NODE_IAM_COMPONENT_TYPE = 'boilerplate:cluster:EksNodeIam'
const EC2_SERVICE_PRINCIPAL = 'ec2.amazonaws.com'
const AMAZON_SSM_MANAGED_INSTANCE_CORE_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
const AMAZON_SSM_PATCH_ASSOCIATION_POLICY_ARN = 'arn:aws:iam::aws:policy/AmazonSSMPatchAssociation'

export class EksNodeIam extends pulumi.ComponentResource implements EksNodeIamResources {
  readonly nodeRoleArn: pulumi.Output<string>
  readonly nodeRoleName: pulumi.Output<string>

  constructor(name: string, args: EksNodeIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EKS_NODE_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const nodeRoleName = resourceName(config, ResourceNameSuffix.EKS_NODE_ROLE)

    const nodeRole = new aws.iam.Role(
      nodeRoleName,
      {
        name: nodeRoleName,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: EC2_SERVICE_PRINCIPAL
        }),
        tags: createTags(config, {
          Name: nodeRoleName
        })
      },
      { parent: this }
    )

    const workerPolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, ResourceNameSuffix.EKS_NODE_WORKER_POLICY_ATTACHMENT),
      {
        role: nodeRole.name,
        policyArn: aws.iam.ManagedPolicy.AmazonEKSWorkerNodePolicy
      },
      { parent: nodeRole }
    )

    const cniPolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, ResourceNameSuffix.EKS_NODE_CNI_POLICY_ATTACHMENT),
      {
        role: nodeRole.name,
        policyArn: aws.iam.ManagedPolicy.AmazonEKS_CNI_Policy
      },
      { parent: nodeRole }
    )

    const ecrPolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, ResourceNameSuffix.EKS_NODE_ECR_POLICY_ATTACHMENT),
      {
        role: nodeRole.name,
        policyArn: aws.iam.ManagedPolicy.AmazonEC2ContainerRegistryReadOnly
      },
      { parent: nodeRole }
    )

    const ssmManagedInstancePolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, ResourceNameSuffix.EKS_NODE_SSM_MANAGED_INSTANCE_POLICY_ATTACHMENT),
      {
        role: nodeRole.name,
        policyArn: AMAZON_SSM_MANAGED_INSTANCE_CORE_POLICY_ARN
      },
      { parent: nodeRole }
    )

    const ssmPatchPolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, ResourceNameSuffix.EKS_NODE_SSM_PATCH_POLICY_ATTACHMENT),
      {
        role: nodeRole.name,
        policyArn: AMAZON_SSM_PATCH_ASSOCIATION_POLICY_ARN
      },
      { parent: nodeRole }
    )

    this.nodeRoleArn = pulumi
      .all([
        nodeRole.arn,
        workerPolicyAttachment.id,
        cniPolicyAttachment.id,
        ecrPolicyAttachment.id,
        ssmManagedInstancePolicyAttachment.id,
        ssmPatchPolicyAttachment.id
      ])
      .apply(([nodeRoleArn]) => nodeRoleArn)
    this.nodeRoleName = nodeRole.name

    this.registerOutputs({
      nodeRoleArn: this.nodeRoleArn,
      nodeRoleName: this.nodeRoleName
    })
  }
}
