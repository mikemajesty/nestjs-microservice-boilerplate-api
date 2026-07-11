import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'

export type CoreDnsCapacityPatchResources = {
  deploymentName: pulumi.Output<string>
}

export type CoreDnsCapacityPatchArgs = {
  config: InfrastructureConfig
  provider: k8s.Provider
}

const COREDNS_CAPACITY_PATCH_COMPONENT_TYPE = 'boilerplate:addon:CoreDnsCapacityPatch'
const COREDNS_NAMESPACE = 'kube-system'
const COREDNS_DEPLOYMENT_NAME = 'coredns'
const COREDNS_REPLICA_COUNT = 1

export class CoreDnsCapacityPatch extends pulumi.ComponentResource implements CoreDnsCapacityPatchResources {
  readonly deploymentName: pulumi.Output<string>

  constructor(name: string, args: CoreDnsCapacityPatchArgs, opts?: pulumi.ComponentResourceOptions) {
    super(COREDNS_CAPACITY_PATCH_COMPONENT_TYPE, name, {}, opts)

    const { config, provider } = args
    const patchName = resourceName(config, resourceNameSuffix.addon.coreDns.capacityPatch)

    const deployment = new k8s.apps.v1.DeploymentPatch(
      patchName,
      {
        metadata: {
          name: COREDNS_DEPLOYMENT_NAME,
          namespace: COREDNS_NAMESPACE
        },
        spec: {
          replicas: COREDNS_REPLICA_COUNT
        }
      },
      { parent: this, provider, dependsOn: opts?.dependsOn }
    )

    this.deploymentName = deployment.metadata.name

    this.registerOutputs({
      deploymentName: this.deploymentName
    })
  }
}
