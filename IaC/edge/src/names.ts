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
  vpcOrigin: `vpc-origin`,
  apiCachePolicy: 'api-cache-policy',
  globalCachePolicy: 'global-cache-policy',
  s3: {
    cdnLogsBucket: 'cdn-logs-bucket',
    cdnLogsBucketPolicy: 'cdn-logs-bucket-policy',
    cdnLogsBucketOwnership: 'cdn-logs-bucket-ownership',
    cdnLogsBucketAcl: 'cdn-logs-bucket-acl'
  },
  originRequestPolicy: 'origin-request-policy',
  apiOriginRequestPolicy: 'api-origin-request-policy'
} as const

type NestedValue<T> = T extends string ? T : { [Key in keyof T]: NestedValue<T[Key]> }[keyof T]
export type ResourceNameSuffix = NestedValue<typeof resourceNameSuffix>
export function resourceName(config: EdgeConfig, suffix: ResourceNameSuffix): string {
  return normalizeName(`${config.projectName}-${config.environment}-${suffix}`)
}
