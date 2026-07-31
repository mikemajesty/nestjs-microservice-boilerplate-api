// src/addon/addon-k8s-configmap.ts

import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName } from '../names'

export type K8sConfigMapResources = {
  configMapName: pulumi.Output<string>
  configMapData: pulumi.Output<{ [key: string]: string }>
}

export type K8sConfigMapArgs = {
  config: InfrastructureConfig
  provider: k8s.Provider
  namespace: string
  name: string
  data: pulumi.Input<{ [key: string]: pulumi.Input<string> }>
  annotations?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>
  labels?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>
}

export class K8sConfigMap extends pulumi.ComponentResource {
  readonly configMapName: pulumi.Output<string>
  readonly configMapData: pulumi.Output<{ [key: string]: string }>

  constructor(name: string, args: K8sConfigMapArgs, opts?: pulumi.ComponentResourceOptions) {
    super('boilerplate:addon:K8sConfigMap', name, {}, opts)

    const { config, provider, namespace, name: configMapName, data, annotations, labels } = args

    const configMap = new k8s.core.v1.ConfigMap(
      resourceName(config, configMapName),
      {
        metadata: {
          name: resourceName(config, configMapName),
          namespace,
          annotations: annotations || {},
          labels: labels || {}
        },
        data: pulumi.output(data)
      },
      {
        provider,
        parent: this,
        dependsOn: [provider]
      }
    )

    this.configMapName = configMap.metadata.name
    this.configMapData = configMap.data

    this.registerOutputs({
      configMapName: this.configMapName,
      configMapData: this.configMapData
    })
  }
}
