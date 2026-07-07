import type { InfrastructureConfig } from './config'

export type ResourceTags = Record<string, string>

export function createTags(config: InfrastructureConfig, extraTags: ResourceTags = {}): ResourceTags {
  return {
    Project: config.projectName,
    Environment: config.environment,
    ManagedBy: 'pulumi',
    ...extraTags
  }
}
