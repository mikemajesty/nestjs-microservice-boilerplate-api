import { CloudFrontVpcOrigin } from './src/cdn/vpc-origin'
import { config } from './src/config'
import { resourceName, resourceNameSuffix } from './src/names'
import { CloudFrontWaf } from './src/security/waf-cloudfront'

const cloudFrontWaf = new CloudFrontWaf(resourceName(config, resourceNameSuffix.security.cloudfrontWaf))

const cloudFrontCdn = new CloudFrontVpcOrigin(resourceName(config, resourceNameSuffix.cdn.appCdn), {
  wafAclArn: cloudFrontWaf.arn
})

export const cdnDomain = cloudFrontCdn.domainName
export const wafAclArn = cloudFrontWaf.arn
