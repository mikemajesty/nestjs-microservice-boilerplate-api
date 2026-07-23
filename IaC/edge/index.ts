import { CloudFrontVpcOrigin } from './src/cdn/cloudfront-vpc-origin'
import { config } from './src/config'
import { resourceName, resourceNameSuffix } from './src/names'
import { CloudFrontWaf } from './src/security/waf-cloudfront'

// Cria recursos na ordem correta de dependência, igual ao foundation
const cloudFrontWaf = new CloudFrontWaf(resourceName(config, resourceNameSuffix.security.cloudfrontWaf), {
  name: 'cloudfront-waf'
})

const cloudFrontCdn = new CloudFrontVpcOrigin(
  resourceName(config, resourceNameSuffix.cdn.appCdn),
  {
    name: 'app-cdn',
    wafAclArn: cloudFrontWaf.arn
  },
  { dependsOn: [cloudFrontWaf] }
)

// Exporta outputs úteis para uso em outros recursos ou consultas
export const cdnDomain = cloudFrontCdn.domainName
export const wafAclArn = cloudFrontWaf.arn
