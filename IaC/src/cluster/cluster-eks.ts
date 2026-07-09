import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EksClusterResources = {
  clusterArn: pulumi.Output<string>
  clusterCertificateAuthorityData: pulumi.Output<string>
  clusterEndpoint: pulumi.Output<string>
  clusterName: pulumi.Output<string>
  clusterOidcIssuerUrl: pulumi.Output<string>
}

export type EksClusterArgs = {
  config: InfrastructureConfig
  clusterRoleArn: pulumi.Input<string>
  subnetIds: pulumi.Input<pulumi.Input<string>[]>
}

const EKS_CLUSTER_COMPONENT_TYPE = 'boilerplate:cluster:EksCluster'
const ENABLED_CLUSTER_LOG_TYPES = ['api', 'audit', 'authenticator']

export class EksCluster extends pulumi.ComponentResource implements EksClusterResources {
  readonly clusterArn: pulumi.Output<string>
  readonly clusterCertificateAuthorityData: pulumi.Output<string>
  readonly clusterEndpoint: pulumi.Output<string>
  readonly clusterName: pulumi.Output<string>
  readonly clusterOidcIssuerUrl: pulumi.Output<string>

  constructor(name: string, args: EksClusterArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EKS_CLUSTER_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterRoleArn, subnetIds } = args
    const clusterName = resourceName(config, resourceNameSuffix.cluster.eks.cluster)

    const cluster = new aws.eks.Cluster(
      clusterName,
      {
        name: clusterName,
        version: config.kubernetesVersion,
        roleArn: clusterRoleArn,
        enabledClusterLogTypes: ENABLED_CLUSTER_LOG_TYPES,
        vpcConfig: {
          endpointPrivateAccess: true,
          endpointPublicAccess: true,
          subnetIds
        },
        tags: createTags(config, {
          Name: clusterName
        })
      },
      {
        parent: this,
        deleteBeforeReplace: true,
        dependsOn: opts?.dependsOn,
        customTimeouts: opts?.customTimeouts
      }
    )

    this.clusterArn = cluster.arn
    this.clusterCertificateAuthorityData = cluster.certificateAuthority.data
    this.clusterEndpoint = cluster.endpoint
    this.clusterName = cluster.name
    this.clusterOidcIssuerUrl = cluster.identities.apply((identities) => identities[0].oidcs[0].issuer)

    this.registerOutputs({
      clusterArn: this.clusterArn,
      clusterCertificateAuthorityData: this.clusterCertificateAuthorityData,
      clusterEndpoint: this.clusterEndpoint,
      clusterName: this.clusterName,
      clusterOidcIssuerUrl: this.clusterOidcIssuerUrl
    })
  }
}
