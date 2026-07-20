import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { name as packageName } from '../../package.json'

export type InfrastructureConfig = {
  projectName: string
  environment: string
  awsRegion: aws.Region
  vpcCidr: string
  availabilityZoneCount: number
  singleNatGateway: boolean
  internalDomainName: string
  kubernetesVersion: string
  appImageTag: string
  enableAppContainerRegistry: boolean
}

const projectConfig = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')

export const config: InfrastructureConfig = {
  projectName: packageName,
  environment: projectConfig.require('environment'),
  awsRegion: awsConfig.require('region') as aws.Region,

  vpcCidr: projectConfig.get('vpcCidr') ?? '10.0.0.0/16',
  availabilityZoneCount: projectConfig.getNumber('availabilityZoneCount') ?? 2,
  singleNatGateway: projectConfig.getBoolean('singleNatGateway') ?? true,

  internalDomainName: projectConfig.get('internalDomainName') ?? 'boilerplate.internal',
  kubernetesVersion: projectConfig.get('kubernetesVersion') ?? '1.35',
  appImageTag: projectConfig.get('appImageTag') ?? 'latest',
  enableAppContainerRegistry: projectConfig.getBoolean('enableAppContainerRegistry') ?? true
}
