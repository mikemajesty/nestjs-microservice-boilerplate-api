import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'

export type WorkloadSmokeAppPublicIngressResources = {
  ingressName: pulumi.Output<string>
}

export type WorkloadSmokeAppPublicIngressArgs = {
  config: InfrastructureConfig
  namespaceName: pulumi.Input<string>
  provider: k8s.Provider
  publicLoadBalancerSecurityGroupId: pulumi.Input<string>
  serviceName: pulumi.Input<string>
}

const WORKLOAD_SMOKE_APP_PUBLIC_INGRESS_COMPONENT_TYPE = 'boilerplate:workload:SmokeAppPublicIngress'
const ALB_INGRESS_CLASS_NAME = 'alb'
const ALB_INTERNET_FACING_SCHEME = 'internet-facing'
const ALB_IP_TARGET_TYPE = 'ip'
const ALB_LISTEN_PORTS = '[{"HTTP":80}]'
const SMOKE_APP_HEALTH_PATH = '/health'
const SMOKE_APP_PORT = 5000

export class WorkloadSmokeAppPublicIngress
  extends pulumi.ComponentResource
  implements WorkloadSmokeAppPublicIngressResources
{
  readonly ingressName: pulumi.Output<string>

  constructor(name: string, args: WorkloadSmokeAppPublicIngressArgs, opts?: pulumi.ComponentResourceOptions) {
    super(WORKLOAD_SMOKE_APP_PUBLIC_INGRESS_COMPONENT_TYPE, name, {}, opts)

    const { config, namespaceName, provider, publicLoadBalancerSecurityGroupId, serviceName } = args
    const ingressName = resourceName(config, ResourceNameSuffix.WORKLOAD_SMOKE_APP_PUBLIC_INGRESS)

    const ingress = new k8s.networking.v1.Ingress(
      ingressName,
      {
        metadata: {
          name: ingressName,
          namespace: namespaceName,
          annotations: {
            'alb.ingress.kubernetes.io/healthcheck-path': SMOKE_APP_HEALTH_PATH,
            'alb.ingress.kubernetes.io/listen-ports': ALB_LISTEN_PORTS,
            'alb.ingress.kubernetes.io/manage-backend-security-group-rules': 'true',
            'alb.ingress.kubernetes.io/scheme': ALB_INTERNET_FACING_SCHEME,
            'alb.ingress.kubernetes.io/security-groups': publicLoadBalancerSecurityGroupId,
            'alb.ingress.kubernetes.io/target-type': ALB_IP_TARGET_TYPE
          }
        },
        spec: {
          ingressClassName: ALB_INGRESS_CLASS_NAME,
          rules: [
            {
              http: {
                paths: [
                  {
                    path: '/',
                    pathType: 'Prefix',
                    backend: {
                      service: {
                        name: serviceName,
                        port: {
                          number: SMOKE_APP_PORT
                        }
                      }
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      { parent: this, provider }
    )

    this.ingressName = ingress.metadata.name

    this.registerOutputs({
      ingressName: this.ingressName
    })
  }
}
