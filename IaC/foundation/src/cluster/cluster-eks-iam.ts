import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EksClusterIamResources = {
  clusterRoleArn: pulumi.Output<string>
  clusterRoleName: pulumi.Output<string>
}

export type EksClusterIamArgs = {
  config: InfrastructureConfig
}

const EKS_CLUSTER_IAM_COMPONENT_TYPE = 'boilerplate:cluster:EksClusterIam'
const EKS_SERVICE_PRINCIPAL = 'eks.amazonaws.com'

export class EksClusterIam extends pulumi.ComponentResource implements EksClusterIamResources {
  readonly clusterRoleArn: pulumi.Output<string>
  readonly clusterRoleName: pulumi.Output<string>

  constructor(name: string, args: EksClusterIamArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EKS_CLUSTER_IAM_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const clusterRoleName = resourceName(config, resourceNameSuffix.cluster.eks.role)

    const clusterRole = new aws.iam.Role(
      clusterRoleName,
      {
        name: clusterRoleName,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: EKS_SERVICE_PRINCIPAL
        }),
        tags: createTags(config, {
          Name: clusterRoleName
        })
      },
      { parent: this }
    )

    const clusterRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
      resourceName(config, resourceNameSuffix.cluster.eks.rolePolicyAttachment),
      {
        role: clusterRole.name,
        policyArn: aws.iam.ManagedPolicy.AmazonEKSClusterPolicy
      },
      { parent: clusterRole }
    )

    this.clusterRoleArn = pulumi
      .all([clusterRole.arn, clusterRolePolicyAttachment.id])
      .apply(([clusterRoleArn]) => clusterRoleArn)
    this.clusterRoleName = clusterRole.name

    this.registerOutputs({
      clusterRoleArn: this.clusterRoleArn,
      clusterRoleName: this.clusterRoleName
    })
  }
}
