import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'

export type WorkloadSmokeAppResources = {
  deploymentName: pulumi.Output<string>
  serviceName: pulumi.Output<string>
}

export type WorkloadSmokeAppArgs = {
  config: InfrastructureConfig
  image: pulumi.Input<string>
  namespaceName: pulumi.Input<string>
  provider: k8s.Provider
}

const WORKLOAD_SMOKE_APP_COMPONENT_TYPE = 'boilerplate:workload:SmokeApp'
const SMOKE_APP_PORT = 5000
const SMOKE_APP_REPLICA_COUNT = 1
const SMOKE_APP_HEALTH_PATH = '/health'

export class WorkloadSmokeApp extends pulumi.ComponentResource implements WorkloadSmokeAppResources {
  readonly deploymentName: pulumi.Output<string>
  readonly serviceName: pulumi.Output<string>

  constructor(name: string, args: WorkloadSmokeAppArgs, opts?: pulumi.ComponentResourceOptions) {
    super(WORKLOAD_SMOKE_APP_COMPONENT_TYPE, name, {}, opts)

    const { config, image, namespaceName, provider } = args
    const appName = resourceName(config, ResourceNameSuffix.WORKLOAD_SMOKE_APP)
    const appLabels = {
      'app.kubernetes.io/name': appName,
      'app.kubernetes.io/part-of': config.projectName,
      'app.kubernetes.io/managed-by': 'pulumi',
      'app.kubernetes.io/environment': config.environment
    }
    const deployment = new k8s.apps.v1.Deployment(
      appName,
      {
        metadata: {
          name: appName,
          namespace: namespaceName,
          labels: appLabels
        },
        spec: {
          replicas: SMOKE_APP_REPLICA_COUNT,
          selector: {
            matchLabels: appLabels
          },
          template: {
            metadata: {
              labels: appLabels
            },
            spec: {
              containers: [
                {
                  name: appName,
                  image,
                  env: [
                    {
                      name: 'APP_MAIN',
                      value: 'main-smoke'
                    }
                  ],
                  ports: [
                    {
                      name: 'http',
                      containerPort: SMOKE_APP_PORT
                    }
                  ],
                  readinessProbe: {
                    httpGet: {
                      path: SMOKE_APP_HEALTH_PATH,
                      port: 'http'
                    }
                  },
                  livenessProbe: {
                    httpGet: {
                      path: SMOKE_APP_HEALTH_PATH,
                      port: 'http'
                    }
                  }
                }
              ]
            }
          }
        }
      },
      { parent: this, provider }
    )

    const service = new k8s.core.v1.Service(
      appName,
      {
        metadata: {
          name: appName,
          namespace: namespaceName,
          labels: appLabels
        },
        spec: {
          type: 'ClusterIP',
          selector: appLabels,
          ports: [
            {
              name: 'http',
              port: SMOKE_APP_PORT,
              targetPort: 'http'
            }
          ]
        }
      },
      { parent: this, provider }
    )

    this.deploymentName = deployment.metadata.name
    this.serviceName = service.metadata.name

    this.registerOutputs({
      deploymentName: this.deploymentName,
      serviceName: this.serviceName
    })
  }
}
