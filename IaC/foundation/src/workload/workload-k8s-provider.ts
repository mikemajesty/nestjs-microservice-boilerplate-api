import * as aws from '@pulumi/aws'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'

export type WorkloadK8sProviderResources = {
  provider: k8s.Provider
}

export type WorkloadK8sProviderArgs = {
  config: InfrastructureConfig
  clusterCertificateAuthorityData: pulumi.Input<string>
  clusterEndpoint: pulumi.Input<string>
  clusterName: pulumi.Input<string>
}

const WORKLOAD_K8S_PROVIDER_COMPONENT_TYPE = 'boilerplate:workload:K8sProvider'

export class WorkloadK8sProvider extends pulumi.ComponentResource implements WorkloadK8sProviderResources {
  readonly provider: k8s.Provider

  constructor(name: string, args: WorkloadK8sProviderArgs, opts?: pulumi.ComponentResourceOptions) {
    super(WORKLOAD_K8S_PROVIDER_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterCertificateAuthorityData, clusterEndpoint, clusterName } = args
    const clusterAuth = aws.eks.getClusterAuthOutput({
      name: clusterName,
      region: config.awsRegion
    })

    const kubeconfig = pulumi
      .all([clusterName, clusterEndpoint, clusterCertificateAuthorityData, clusterAuth.token])
      .apply(([name, server, certificateAuthorityData, token]) =>
        JSON.stringify({
          apiVersion: 'v1',
          kind: 'Config',
          clusters: [
            {
              name,
              cluster: {
                server,
                'certificate-authority-data': certificateAuthorityData
              }
            }
          ],
          contexts: [
            {
              name,
              context: {
                cluster: name,
                user: name
              }
            }
          ],
          'current-context': name,
          users: [
            {
              name,
              user: {
                token
              }
            }
          ]
        })
      )

    this.provider = new k8s.Provider(
      name,
      {
        kubeconfig,
        enableServerSideApply: true
      },
      { parent: this }
    )

    this.registerOutputs({})
  }
}
