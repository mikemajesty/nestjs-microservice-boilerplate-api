import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'

export type ArgoCdRootApplicationResources = {
  applicationName: pulumi.Output<string>
}

export type ArgoCdRootApplicationArgs = {
  config: InfrastructureConfig
  namespaceName: pulumi.Input<string>
  provider: k8s.Provider
}

const ARGOCD_ROOT_APPLICATION_COMPONENT_TYPE = 'boilerplate:addon:ArgoCdRootApplication'
const ARGOCD_APPLICATION_API_VERSION = 'argoproj.io/v1alpha1'
const ARGOCD_APPLICATION_KIND = 'Application'
const ARGOCD_PROJECT_NAME = 'default'
const ARGOCD_REPOSITORY_URL = 'https://github.com/mikemajesty/nestjs-microservice-boilerplate-api.git'
const ARGOCD_TARGET_REVISION = 'master'
const ARGOCD_APPLICATIONS_PATH = 'gitops/argocd/applications'
const KUBERNETES_INTERNAL_API_SERVER = 'https://kubernetes.default.svc'

export class ArgoCdRootApplication extends pulumi.ComponentResource implements ArgoCdRootApplicationResources {
  readonly applicationName: pulumi.Output<string>

  constructor(name: string, args: ArgoCdRootApplicationArgs, opts?: pulumi.ComponentResourceOptions) {
    super(ARGOCD_ROOT_APPLICATION_COMPONENT_TYPE, name, {}, opts)

    const { config, namespaceName, provider } = args
    const applicationName = resourceName(config, resourceNameSuffix.addon.argoCd.rootApplication)

    const application = new k8s.apiextensions.CustomResource(
      applicationName,
      {
        apiVersion: ARGOCD_APPLICATION_API_VERSION,
        kind: ARGOCD_APPLICATION_KIND,
        metadata: {
          name: applicationName,
          namespace: namespaceName
        },
        spec: {
          project: ARGOCD_PROJECT_NAME,
          source: {
            repoURL: ARGOCD_REPOSITORY_URL,
            targetRevision: ARGOCD_TARGET_REVISION,
            path: ARGOCD_APPLICATIONS_PATH
          },
          destination: {
            server: KUBERNETES_INTERNAL_API_SERVER,
            namespace: namespaceName
          },
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true
            }
          }
        }
      },
      { parent: this, provider, dependsOn: opts?.dependsOn }
    )

    this.applicationName = application.metadata.name

    this.registerOutputs({
      applicationName: this.applicationName
    })
  }
}
