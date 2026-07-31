import type { EdgeConfig } from './config'

export type ResourceTags = Record<string, string>

export function createTags(config: EdgeConfig, extraTags: ResourceTags = {}): ResourceTags {
  return {
    Project: config.projectName,
    Environment: config.environment,
    ManagedBy: 'pulumi',
    ...extraTags
  }
}
