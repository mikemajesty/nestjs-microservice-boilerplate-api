import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'

export type ArgoCdResources = {
  namespaceName: pulumi.Output<string>
  release: k8s.helm.v3.Release
  releaseName: pulumi.Output<string>
}

export type ArgoCdArgs = {
  config: InfrastructureConfig
  provider: k8s.Provider
}

const ARGOCD_COMPONENT_TYPE = 'boilerplate:addon:ArgoCd'
const ARGOCD_CHART = 'argo-cd'
const ARGOCD_REPOSITORY = 'https://argoproj.github.io/argo-helm'
const ARGOCD_NAMESPACE_NAME = 'argocd'
const CLUSTER_IP_SERVICE_TYPE = 'ClusterIP'
const DISABLED_REPLICAS = 0

export class ArgoCd extends pulumi.ComponentResource implements ArgoCdResources {
  readonly namespaceName: pulumi.Output<string>
  readonly release: k8s.helm.v3.Release
  readonly releaseName: pulumi.Output<string>

  constructor(name: string, args: ArgoCdArgs, opts?: pulumi.ComponentResourceOptions) {
    super(ARGOCD_COMPONENT_TYPE, name, {}, opts)

    const { config, provider } = args
    const releaseName = resourceName(config, ResourceNameSuffix.ARGOCD)

    const namespace = new k8s.core.v1.Namespace(
      ARGOCD_NAMESPACE_NAME,
      {
        metadata: {
          name: ARGOCD_NAMESPACE_NAME
        }
      },
      { parent: this, provider }
    )

    const release = new k8s.helm.v3.Release(
      releaseName,
      {
        chart: ARGOCD_CHART,
        cleanupOnFail: true,
        name: ARGOCD_CHART,
        namespace: namespace.metadata.name,
        repositoryOpts: {
          repo: ARGOCD_REPOSITORY
        },
        values: {
          applicationSet: {
            replicas: DISABLED_REPLICAS
          },
          configs: {
            secret: {
              extra: {
                'server.secretkey': releaseName
              }
            }
          },
          dex: {
            enabled: false
          },
          notifications: {
            enabled: false
          },
          server: {
            service: {
              type: CLUSTER_IP_SERVICE_TYPE
            }
          }
        }
      },
      { parent: namespace, provider }
    )

    this.namespaceName = namespace.metadata.name
    this.release = release
    this.releaseName = release.name

    this.registerOutputs({
      namespaceName: this.namespaceName,
      releaseName: this.releaseName
    })
  }
}
