import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EksNodeGroupResources = {
  nodeGroup: aws.eks.NodeGroup
  nodeGroupArn: pulumi.Output<string>
  nodeGroupName: pulumi.Output<string>
  nodeGroupStatus: pulumi.Output<string>
}

export type EksNodeGroupArgs = {
  config: InfrastructureConfig
  clusterName: pulumi.Input<string>
  nodeRoleArn: pulumi.Input<string>
  subnetIds: pulumi.Input<pulumi.Input<string>[]>
}

const EKS_NODE_GROUP_COMPONENT_TYPE = 'boilerplate:cluster:EksNodeGroup'
const NODE_GROUP_MIN_SIZE = 1
const NODE_GROUP_DESIRED_SIZE = 1
const NODE_GROUP_MAX_SIZE = 2
const NODE_GROUP_INSTANCE_TYPES = ['t3.medium']
const NODE_GROUP_MAX_UNAVAILABLE = 1

export class EksNodeGroup extends pulumi.ComponentResource implements EksNodeGroupResources {
  readonly nodeGroup: aws.eks.NodeGroup
  readonly nodeGroupArn: pulumi.Output<string>
  readonly nodeGroupName: pulumi.Output<string>
  readonly nodeGroupStatus: pulumi.Output<string>

  constructor(name: string, args: EksNodeGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EKS_NODE_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterName, nodeRoleArn, subnetIds } = args
    const nodeGroupName = resourceName(config, resourceNameSuffix.cluster.eks.nodeGroup)

    const nodeGroup = new aws.eks.NodeGroup(
      nodeGroupName,
      {
        clusterName,
        nodeGroupName,
        nodeRoleArn,
        subnetIds,
        scalingConfig: {
          minSize: NODE_GROUP_MIN_SIZE,
          desiredSize: NODE_GROUP_DESIRED_SIZE,
          maxSize: NODE_GROUP_MAX_SIZE
        },
        instanceTypes: NODE_GROUP_INSTANCE_TYPES,
        updateConfig: {
          maxUnavailable: NODE_GROUP_MAX_UNAVAILABLE
        },
        tags: createTags(config, {
          Name: nodeGroupName
        })
      },
      {
        parent: this,
        dependsOn: opts?.dependsOn,
        customTimeouts: opts?.customTimeouts
      }
    )

    this.nodeGroup = nodeGroup
    this.nodeGroupArn = nodeGroup.arn
    this.nodeGroupName = nodeGroup.nodeGroupName
    this.nodeGroupStatus = nodeGroup.status

    this.registerOutputs({
      nodeGroupArn: this.nodeGroupArn,
      nodeGroupName: this.nodeGroupName,
      nodeGroupStatus: this.nodeGroupStatus
    })
  }
}
