import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'

export type ExternalDnsResources = {
  releaseName: pulumi.Output<string>
}

export type ExternalDnsArgs = {
  config: InfrastructureConfig
  provider: k8s.Provider
  roleArn: pulumi.Input<string>
  serviceAccountName: pulumi.Input<string>
  serviceAccountNamespace: pulumi.Input<string>
}

const EXTERNAL_DNS_COMPONENT_TYPE = 'boilerplate:addon:ExternalDns'
const EXTERNAL_DNS_CHART = 'external-dns'
const EXTERNAL_DNS_REPOSITORY = 'https://kubernetes-sigs.github.io/external-dns/'
const SERVICE_ACCOUNT_ROLE_ARN_ANNOTATION = 'eks.amazonaws.com/role-arn'

export class ExternalDns extends pulumi.ComponentResource implements ExternalDnsResources {
  readonly releaseName: pulumi.Output<string>

  constructor(name: string, args: ExternalDnsArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EXTERNAL_DNS_COMPONENT_TYPE, name, {}, opts)

    const { config, provider, roleArn, serviceAccountName, serviceAccountNamespace } = args
    const releaseName = resourceName(config, resourceNameSuffix.addon.externalDns.release)

    const release = new k8s.helm.v3.Release(
      releaseName,
      {
        chart: EXTERNAL_DNS_CHART,
        cleanupOnFail: true,
        name: EXTERNAL_DNS_CHART,
        namespace: serviceAccountNamespace,
        repositoryOpts: {
          repo: EXTERNAL_DNS_REPOSITORY
        },
        values: {
          domainFilters: [config.internalDomainName],
          extraArgs: ['--aws-zone-type=private'],
          policy: 'sync',
          provider: {
            name: 'aws'
          },
          registry: 'txt',
          sources: ['service', 'ingress', 'gateway-httproute'],
          serviceAccount: {
            annotations: {
              [SERVICE_ACCOUNT_ROLE_ARN_ANNOTATION]: roleArn
            },
            create: true,
            name: serviceAccountName
          },
          txtOwnerId: `${config.projectName}-${config.environment}`
        }
      },
      { parent: this, provider }
    )

    this.releaseName = release.name

    this.registerOutputs({
      releaseName: this.releaseName
    })
  }
}
