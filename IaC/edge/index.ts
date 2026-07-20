import { config } from './src/config'

export const foundation = {
  projectName: config.foundationProjectName,
  privateSubnetIds: config.foundation.getOutput('vpc').apply((vpc) => vpc.privateSubnetIds),
  stack: config.foundationStack,
  vpcId: config.foundation.getOutput('vpc').apply((vpc) => vpc.id)
}

export const edge = {
  enabled: false,
  environment: config.environment,
  projectName: config.projectName
}
