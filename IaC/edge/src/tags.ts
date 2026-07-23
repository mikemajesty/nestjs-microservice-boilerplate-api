import { config } from './config'

export const commonTags = {
  Project: config.projectName,
  Environment: config.environment,
  ManagedBy: 'pulumi'
}
