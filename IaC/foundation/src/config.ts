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
  appPostgresDatabase: string
  appPostgresUsername: string
  appPostgresInstanceClass: string
  appPostgresAllocatedStorage: number
  appRedisNodeType: string
  appRedisEngineVersion: string
  appRedisPort: number
  appMongoDatabase: string
  appMongoUsername: string
  appMongoInstanceClass: string
  appMongoEngineVersion: string
  appMongoPort: number
}

const projectConfig = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')

export const config: InfrastructureConfig = {
  projectName: packageName,
  environment: projectConfig.require('environment'),
  awsRegion: awsConfig.require('region') as aws.Region,

  vpcCidr: projectConfig.require('vpcCidr'),
  availabilityZoneCount: projectConfig.getNumber('availabilityZoneCount') ?? 2,
  singleNatGateway: projectConfig.getBoolean('singleNatGateway') ?? true,

  internalDomainName: projectConfig.get('internalDomainName') ?? 'boilerplate.internal',
  kubernetesVersion: projectConfig.get('kubernetesVersion') ?? '1.35',
  appImageTag: projectConfig.get('appImageTag') ?? 'latest',
  enableAppContainerRegistry: projectConfig.getBoolean('enableAppContainerRegistry') ?? true,
  appPostgresDatabase: projectConfig.get('appPostgresDatabase') ?? 'nestjs_microservice',
  appPostgresUsername: projectConfig.get('appPostgresUsername') ?? 'boilerplate',
  appPostgresInstanceClass: projectConfig.get('appPostgresInstanceClass') ?? 'db.t4g.micro',
  appPostgresAllocatedStorage: projectConfig.getNumber('appPostgresAllocatedStorage') ?? 20,
  appRedisNodeType: projectConfig.get('appRedisNodeType') ?? 'cache.t4g.micro',
  appRedisEngineVersion: projectConfig.get('appRedisEngineVersion') ?? '7.1',
  appRedisPort: projectConfig.getNumber('appRedisPort') ?? 6379,
  appMongoDatabase: projectConfig.get('appMongoDatabase') ?? 'nestjs_microservice',
  appMongoUsername: projectConfig.get('appMongoUsername') ?? 'boilerplate',
  appMongoInstanceClass: projectConfig.get('appMongoInstanceClass') ?? 'db.t3.medium',
  appMongoEngineVersion: projectConfig.get('appMongoEngineVersion') ?? '5.0.0',
  appMongoPort: projectConfig.getNumber('appMongoPort') ?? 27017
}
