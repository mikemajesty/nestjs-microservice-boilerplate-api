import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { name as packageName } from '../../package.json'

export type EdgeConfig = {
  projectName: string
  environment: string
  awsRegion: aws.Region
  foundationProjectName: string
  foundationStack: string
  foundationStackName: string
  foundation: pulumi.StackReference
}

const projectConfig = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')

const foundationProjectName = projectConfig.require('foundationProjectName')
const foundationStack = projectConfig.require('foundationStack')
const foundationStackName = `${pulumi.getOrganization()}/${foundationProjectName}/${foundationStack}`

const rawAwsRegion = awsConfig.require('region')

if (!Object.values(aws.Region).includes(rawAwsRegion as aws.Region)) {
  throw new Error(`Região AWS inválida: ${rawAwsRegion}. Use uma região AWS válida.`)
}
const awsRegion = rawAwsRegion as aws.Region

const foundation = new pulumi.StackReference(foundationStackName)

export const config: EdgeConfig = {
  projectName: packageName,
  environment: projectConfig.require('environment'),
  awsRegion,
  foundationProjectName,
  foundationStack,
  foundationStackName,
  foundation
}
