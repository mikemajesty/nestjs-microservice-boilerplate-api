import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type InternalDnsResources = {
  privateHostedZoneId: pulumi.Output<string>
  internalDomainName: string
}

export type InternalDnsArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
}

const INTERNAL_DNS_COMPONENT_TYPE = 'boilerplate:dns:InternalDns'

export class InternalDns extends pulumi.ComponentResource implements InternalDnsResources {
  readonly privateHostedZoneId: pulumi.Output<string>
  readonly internalDomainName: string

  constructor(name: string, args: InternalDnsArgs, opts?: pulumi.ComponentResourceOptions) {
    super(INTERNAL_DNS_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId } = args
    const privateHostedZoneName = resourceName(config, ResourceNameSuffix.PRIVATE_HOSTED_ZONE)

    // A Private Hosted Zone cria o dominio interno, mas nao cria records ainda.
    const privateHostedZone = new aws.route53.Zone(
      privateHostedZoneName,
      {
        name: config.internalDomainName,
        // Associar a zona a VPC faz os nomes privados resolverem dentro dessa VPC.
        vpcs: [
          {
            vpcId,
            vpcRegion: config.awsRegion
          }
        ],
        tags: createTags(config, {
          Name: privateHostedZoneName
        })
      },
      { parent: this }
    )

    this.privateHostedZoneId = privateHostedZone.zoneId
    this.internalDomainName = config.internalDomainName

    this.registerOutputs({
      privateHostedZoneId: this.privateHostedZoneId,
      internalDomainName: this.internalDomainName
    })
  }
}
