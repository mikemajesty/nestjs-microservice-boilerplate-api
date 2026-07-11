import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'

export type AwsLoadBalancerControllerResources = {
  releaseName: pulumi.Output<string>
}

export type AwsLoadBalancerControllerArgs = {
  clusterName: pulumi.Input<string>
  config: InfrastructureConfig
  provider: k8s.Provider
  roleArn: pulumi.Input<string>
  serviceAccountName: pulumi.Input<string>
  serviceAccountNamespace: pulumi.Input<string>
  vpcId: pulumi.Input<string>
}

const AWS_LOAD_BALANCER_CONTROLLER_COMPONENT_TYPE = 'boilerplate:addon:AwsLoadBalancerController'
const AWS_LOAD_BALANCER_CONTROLLER_CHART = 'aws-load-balancer-controller'
const AWS_LOAD_BALANCER_CONTROLLER_REPOSITORY = 'https://aws.github.io/eks-charts'
const CONTROLLER_REPLICA_COUNT = 1
const SERVICE_ACCOUNT_ROLE_ARN_ANNOTATION = 'eks.amazonaws.com/role-arn'

export class AwsLoadBalancerController extends pulumi.ComponentResource implements AwsLoadBalancerControllerResources {
  readonly releaseName: pulumi.Output<string>

  constructor(name: string, args: AwsLoadBalancerControllerArgs, opts?: pulumi.ComponentResourceOptions) {
    super(AWS_LOAD_BALANCER_CONTROLLER_COMPONENT_TYPE, name, {}, opts)

    const { clusterName, config, provider, roleArn, serviceAccountName, serviceAccountNamespace, vpcId } = args
    const releaseName = resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.release)

    const release = new k8s.helm.v3.Release(
      releaseName,
      {
        chart: AWS_LOAD_BALANCER_CONTROLLER_CHART,
        cleanupOnFail: true,
        name: AWS_LOAD_BALANCER_CONTROLLER_CHART,
        namespace: serviceAccountNamespace,
        repositoryOpts: {
          repo: AWS_LOAD_BALANCER_CONTROLLER_REPOSITORY
        },
        values: {
          clusterName,
          replicaCount: CONTROLLER_REPLICA_COUNT,
          region: config.awsRegion,
          serviceAccount: {
            annotations: {
              [SERVICE_ACCOUNT_ROLE_ARN_ANNOTATION]: roleArn
            },
            create: true,
            name: serviceAccountName
          },
          vpcId
        }
      },
      { parent: this, provider }
    )

    this.releaseName = release.name

    this.registerOutputs({
      releaseName: this.releaseName
    })
  }
}
