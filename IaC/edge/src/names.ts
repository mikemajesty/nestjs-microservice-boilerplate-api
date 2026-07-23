import type { EdgeConfig } from './config'

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const resourceNameSuffix = {
  security: {
    cloudfrontWaf: 'cloudfront-waf'
  },
  cdn: {
    appCdn: 'app-cdn'
  },
  apiCachePolicy: 'api-cache-policy',
  globalCachePolicy: 'global-cache-policy'
} as const

type NestedValue<T> = T extends string ? T : { [Key in keyof T]: NestedValue<T[Key]> }[keyof T]
export type ResourceNameSuffix = NestedValue<typeof resourceNameSuffix>
export function resourceName(config: EdgeConfig, suffix: ResourceNameSuffix): string {
  return normalizeName(`${config.projectName}-${config.environment}-${suffix}`)
}
