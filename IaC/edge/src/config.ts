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

export const config: EdgeConfig = {
  projectName: packageName,
  environment: projectConfig.require('environment'),
  awsRegion: awsConfig.require('region') as aws.Region,
  foundationProjectName,
  foundationStack,
  foundationStackName,
  foundation: new pulumi.StackReference(foundationStackName)
}
