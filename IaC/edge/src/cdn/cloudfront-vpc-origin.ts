import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { config } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { commonTags } from '../tags'

export type CloudFrontDistributionProps = {
  name: string
  wafAclArn: pulumi.Input<string>
}

const CDN_CLOUDFRONT_VPC_ORIGIN_COMPONENT_TYPE = 'boilerplate:cdn:CloudFrontVpcOrigin'

export class CloudFrontVpcOrigin extends pulumi.ComponentResource {
  public readonly distribution: aws.cloudfront.Distribution
  public readonly domainName: pulumi.Output<string>

  constructor(name: string, props: CloudFrontDistributionProps, opts?: pulumi.ComponentResourceOptions) {
    super(CDN_CLOUDFRONT_VPC_ORIGIN_COMPONENT_TYPE, name, {}, opts)

    const envoyNlb = aws.lb.getLoadBalancer({
      tags: {
        'elbv2.k8s.aws/cluster': 'nestjs-boilerplate-dev-eks-cluster'
      }
    })

    const ORIGIN_ID = 'envoy-gateway-origin'

    // ✅ 1. Política GLOBAL (cache compartilhado - IGNORA Authorization)
    const globalCachePolicy = new aws.cloudfront.CachePolicy(
      resourceName(config, resourceNameSuffix.globalCachePolicy),
      {
        name: resourceName(config, resourceNameSuffix.globalCachePolicy),
        comment: 'Cache global: compartilhado por todos os usuários',
        minTtl: 0,
        defaultTtl: 0, // 🔥 ZERO por padrão (opt-in via Cache-Control)
        maxTtl: 86400, // 24h (máximo)
        parametersInCacheKeyAndForwardedToOrigin: {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          cookiesConfig: { cookieBehavior: 'none' },
          headersConfig: {
            headerBehavior: 'whitelist',
            headers: {
              items: ['CloudFront-Viewer-Address'] // ❌ SEM Authorization
            }
          },
          queryStringsConfig: { queryStringBehavior: 'all' }
        }
      },
      { parent: this }
    )

    // ✅ 2. Política POR USUÁRIO (cache isolado - INCLUI Authorization)
    const userCachePolicy = new aws.cloudfront.CachePolicy(
      resourceName(config, resourceNameSuffix.apiCachePolicy),
      {
        name: resourceName(config, resourceNameSuffix.apiCachePolicy),
        comment: 'Cache por usuário: isolado por Authorization',
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 3600,
        parametersInCacheKeyAndForwardedToOrigin: {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          cookiesConfig: { cookieBehavior: 'none' },
          headersConfig: {
            headerBehavior: 'whitelist',
            headers: {
              items: ['Authorization', 'CloudFront-Viewer-Address'] // ✅ COM Authorization
            }
          },
          queryStringsConfig: { queryStringBehavior: 'all' }
        }
      },
      { parent: this }
    )

    const vpcOrigin = new aws.cloudfront.VpcOrigin(
      resourceName(config, resourceNameSuffix.cdn.appCdn),
      {
        vpcOriginEndpointConfig: {
          name: resourceName(config, resourceNameSuffix.cdn.appCdn),
          arn: pulumi.output(envoyNlb.then((nlb) => nlb.arn)),
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: 'https-only',
          originSslProtocols: {
            items: ['TLSv1.3'],
            quantity: 1
          }
        },
        tags: { ...commonTags }
      },
      { parent: this }
    )

    this.distribution = new aws.cloudfront.Distribution(
      resourceName(config, resourceNameSuffix.cdn.appCdn),
      {
        origins: [
          {
            originId: ORIGIN_ID,
            domainName: envoyNlb.then((nlb) => nlb.dnsName),
            customOriginConfig: {
              originProtocolPolicy: 'https-only',
              httpsPort: 443,
              httpPort: 80,
              originSslProtocols: ['TLSv1.3']
            },
            vpcOriginConfig: {
              vpcOriginId: vpcOrigin.id
            }
          }
        ],
        webAclId: props.wafAclArn,
        enabled: true,
        isIpv6Enabled: true,

        orderedCacheBehaviors: [
          {
            pathPattern: '/api/public/*',
            cachePolicyId: globalCachePolicy.id,
            originRequestPolicyId: 'ac4a1b1a-2f0a-42b1-9a3f-8b8a3f8b8a3f',
            targetOriginId: ORIGIN_ID,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 86400
          },
          {
            pathPattern: '/api/*',
            cachePolicyId: userCachePolicy.id,
            originRequestPolicyId: 'ac4a1b1a-2f0a-42b1-9a3f-8b8a3f8b8a3f',
            targetOriginId: ORIGIN_ID,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 3600
          }
        ],

        defaultCacheBehavior: {
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6', // Managed-CachingOptimized
          originRequestPolicyId: 'ac4a1b1a-2f0a-42b1-9a3f-8b8a3f8b8a3f',
          targetOriginId: ORIGIN_ID,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true
        },

        priceClass: 'PriceClass_100',
        restrictions: { geoRestriction: { restrictionType: 'none' } },
        viewerCertificate: { cloudfrontDefaultCertificate: true },
        tags: { ...commonTags },
        loggingConfig: {
          bucket: `${name}-logs.s3.amazonaws.com`,
          includeCookies: false,
          prefix: 'cloudfront/'
        }
      },
      { parent: this }
    )

    this.domainName = this.distribution.domainName
    this.registerOutputs({
      domainName: this.domainName
    })
  }
}
