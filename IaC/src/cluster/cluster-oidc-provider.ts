import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type EksOidcProviderResources = {
  oidcProviderArn: pulumi.Output<string>
  oidcProviderUrl: pulumi.Output<string>
}

export type EksOidcProviderArgs = {
  config: InfrastructureConfig
  clusterOidcIssuerUrl: pulumi.Input<string>
}

const EKS_OIDC_PROVIDER_COMPONENT_TYPE = 'boilerplate:cluster:EksOidcProvider'
const STS_AUDIENCE = 'sts.amazonaws.com'

export class EksOidcProvider extends pulumi.ComponentResource implements EksOidcProviderResources {
  readonly oidcProviderArn: pulumi.Output<string>
  readonly oidcProviderUrl: pulumi.Output<string>

  constructor(name: string, args: EksOidcProviderArgs, opts?: pulumi.ComponentResourceOptions) {
    super(EKS_OIDC_PROVIDER_COMPONENT_TYPE, name, {}, opts)

    const { config, clusterOidcIssuerUrl } = args
    const oidcProviderName = resourceName(config, ResourceNameSuffix.EKS_CLUSTER_OIDC_PROVIDER)

    const oidcProvider = new aws.iam.OpenIdConnectProvider(
      oidcProviderName,
      {
        url: clusterOidcIssuerUrl,
        clientIdLists: [STS_AUDIENCE],
        tags: createTags(config, {
          Name: oidcProviderName
        })
      },
      { parent: this }
    )

    this.oidcProviderArn = oidcProvider.arn
    this.oidcProviderUrl = oidcProvider.url

    this.registerOutputs({
      oidcProviderArn: this.oidcProviderArn,
      oidcProviderUrl: this.oidcProviderUrl
    })
  }
}
