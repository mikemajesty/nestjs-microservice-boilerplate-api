import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { config } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'
import { CdnLogsBucket } from './cdn-logs-bucket'

export type CloudFrontVpcOriginResources = {
  distribution: aws.cloudfront.Distribution
  domainName: pulumi.Output<string>
}

export type CloudFrontVpcOriginArgs = {
  wafAclArn: pulumi.Input<string>
}

const CDN_CLOUDFRONT_VPC_ORIGIN_COMPONENT_TYPE = 'boilerplate:cdn:CloudFrontVpcOrigin'
const MANAGED_CACHING_OPTIMIZED_POLICY_ID = '658327ea-f89d-4fab-a63d-7e88639e58f6'

export class CloudFrontVpcOrigin extends pulumi.ComponentResource implements CloudFrontVpcOriginResources {
  readonly distribution: aws.cloudfront.Distribution
  readonly domainName: pulumi.Output<string>
  private readonly originId = 'envoy-gateway-origin'

  constructor(name: string, args: CloudFrontVpcOriginArgs, opts?: pulumi.ComponentResourceOptions) {
    super(CDN_CLOUDFRONT_VPC_ORIGIN_COMPONENT_TYPE, name, {}, opts)

    const envoyNlb = aws.lb.getLoadBalancer({ tags: { application: 'envoy-gateway-nlb' } })

    const logsBucket = new CdnLogsBucket(resourceName(config, resourceNameSuffix.s3.cdnLogsBucket), { parent: this })

    const originRequestPolicy = new aws.cloudfront.OriginRequestPolicy(
      resourceName(config, resourceNameSuffix.originRequestPolicy),
      {
        name: resourceName(config, resourceNameSuffix.originRequestPolicy),
        comment: 'Forwards all query strings to origin, no cookies or headers',
        cookiesConfig: { cookieBehavior: 'none' },
        headersConfig: { headerBehavior: 'none' },
        queryStringsConfig: { queryStringBehavior: 'all' }
      },
      { parent: this }
    )

    const globalCachePolicy = new aws.cloudfront.CachePolicy(
      resourceName(config, resourceNameSuffix.globalCachePolicy),
      {
        name: resourceName(config, resourceNameSuffix.globalCachePolicy),
        comment: 'Shared cache across all users',
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 86400,
        parametersInCacheKeyAndForwardedToOrigin: {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          cookiesConfig: { cookieBehavior: 'none' },
          headersConfig: { headerBehavior: 'none' },
          queryStringsConfig: { queryStringBehavior: 'all' }
        }
      },
      { parent: this }
    )

    const userCachePolicy = new aws.cloudfront.CachePolicy(
      resourceName(config, resourceNameSuffix.apiCachePolicy),
      {
        name: resourceName(config, resourceNameSuffix.apiCachePolicy),
        comment: 'Per-user cache keyed by Authorization header',
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 3600,
        parametersInCacheKeyAndForwardedToOrigin: {
          enableAcceptEncodingGzip: true,
          enableAcceptEncodingBrotli: true,
          cookiesConfig: { cookieBehavior: 'none' },
          headersConfig: {
            headerBehavior: 'whitelist',
            headers: { items: ['Authorization'] }
          },
          queryStringsConfig: { queryStringBehavior: 'all' }
        }
      },
      { parent: this }
    )

    const vpcOrigin = new aws.cloudfront.VpcOrigin(
      resourceName(config, resourceNameSuffix.vpcOrigin),
      {
        vpcOriginEndpointConfig: {
          name: resourceName(config, resourceNameSuffix.vpcOrigin),
          arn: envoyNlb.then((nlb) => nlb.arn),
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: 'https-only',
          originSslProtocols: { items: ['TLSv1.2'], quantity: 1 }
        },
        tags: createTags(config)
      },
      { parent: this }
    )

    this.distribution = new aws.cloudfront.Distribution(
      resourceName(config, resourceNameSuffix.cdn.appCdn),
      {
        origins: [
          {
            originId: this.originId,
            domainName: envoyNlb.then((nlb) => nlb.dnsName),
            vpcOriginConfig: { vpcOriginId: vpcOrigin.id }
          }
        ],
        webAclId: args.wafAclArn,
        enabled: true,
        isIpv6Enabled: true,
        orderedCacheBehaviors: [
          {
            pathPattern: '/api/public/*',
            cachePolicyId: globalCachePolicy.id,
            originRequestPolicyId: originRequestPolicy.id,
            targetOriginId: this.originId,
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
            originRequestPolicyId: originRequestPolicy.id,
            targetOriginId: this.originId,
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
          cachePolicyId: MANAGED_CACHING_OPTIMIZED_POLICY_ID,
          originRequestPolicyId: originRequestPolicy.id,
          targetOriginId: this.originId,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true
        },
        priceClass: 'PriceClass_100',
        restrictions: { geoRestriction: { restrictionType: 'none' } },
        viewerCertificate: { cloudfrontDefaultCertificate: true },
        tags: createTags(config),
        loggingConfig: {
          bucket: logsBucket.bucketDomainName,
          includeCookies: false,
          prefix: 'cloudfront/'
        }
      },
      { parent: this }
    )

    this.domainName = this.distribution.domainName

    this.registerOutputs({ domainName: this.domainName })
  }
}
