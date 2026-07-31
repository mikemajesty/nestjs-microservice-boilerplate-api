import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName } from '../names'

export type ConfigMapK8sProviderResources = {
  provider: k8s.Provider
  providerName: pulumi.Output<string>
}

export type ConfigMapK8sProviderArgs = {
  config: InfrastructureConfig
  clusterCertificateAuthorityData: pulumi.Input<string>
  clusterEndpoint: pulumi.Input<string>
  clusterName: pulumi.Input<string>
}

const CONFIGMAP_PROVIDER_COMPONENT_TYPE = 'boilerplate:cluster:ConfigMapK8sProvider'

export class ConfigMapK8sProvider extends pulumi.ComponentResource implements ConfigMapK8sProviderResources {
  readonly provider: k8s.Provider
  readonly providerName: pulumi.Output<string>

  constructor(name: string, args: ConfigMapK8sProviderArgs, opts?: pulumi.ComponentResourceOptions) {
    super(CONFIGMAP_PROVIDER_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterCertificateAuthorityData, clusterEndpoint, clusterName } = args

    const region = 'us-east-1'

    const kubeconfig = pulumi.interpolate`
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: ${clusterCertificateAuthorityData}
    server: ${clusterEndpoint}
  name: ${clusterName}
contexts:
- context:
    cluster: ${clusterName}
    user: ${clusterName}
  name: ${clusterName}
current-context: ${clusterName}
kind: Config
users:
- name: ${clusterName}
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args:
        - eks
        - get-token
        - --cluster-name
        - ${clusterName}
        - --region
        - ${region}
`

    const provider = new k8s.Provider(
      resourceName(config, name),
      {
        kubeconfig
      },
      {
        parent: this,
        ...opts,
        customTimeouts: {
          create: '1m',
          update: '1m',
          delete: '1m'
        }
      }
    )

    this.provider = provider
    this.providerName = provider.urn

    this.registerOutputs({
      provider: this.provider,
      providerName: this.providerName
    })
  }
}
