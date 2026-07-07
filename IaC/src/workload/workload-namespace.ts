import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'

export type WorkloadNamespaceResources = {
  namespaceName: pulumi.Output<string>
}

export type WorkloadNamespaceArgs = {
  config: InfrastructureConfig
  provider: k8s.Provider
}

const WORKLOAD_NAMESPACE_COMPONENT_TYPE = 'boilerplate:workload:Namespace'

export class WorkloadNamespace extends pulumi.ComponentResource implements WorkloadNamespaceResources {
  readonly namespaceName: pulumi.Output<string>

  constructor(name: string, args: WorkloadNamespaceArgs, opts?: pulumi.ComponentResourceOptions) {
    super(WORKLOAD_NAMESPACE_COMPONENT_TYPE, name, {}, opts)

    const { config, provider } = args
    const namespaceName = resourceName(config, ResourceNameSuffix.WORKLOAD_NAMESPACE)

    const namespace = new k8s.core.v1.Namespace(
      namespaceName,
      {
        metadata: {
          name: namespaceName,
          labels: {
            'app.kubernetes.io/name': config.projectName,
            'app.kubernetes.io/part-of': config.projectName,
            'app.kubernetes.io/managed-by': 'pulumi',
            'app.kubernetes.io/environment': config.environment
          }
        }
      },
      { parent: this, provider }
    )

    this.namespaceName = namespace.metadata.name

    this.registerOutputs({
      namespaceName: this.namespaceName
    })
  }
}
