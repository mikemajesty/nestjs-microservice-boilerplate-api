import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { config } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type CloudFrontWafResources = {
  acl: aws.wafv2.WebAcl
  arn: pulumi.Output<string>
}

export type CloudFrontWafArgs = {
  rateLimit?: number
}

const SECURITY_WAF_COMPONENT_TYPE = 'boilerplate:edge:security:CloudFrontWaf'

type VisibilityConfig = {
  sampledRequestsEnabled: boolean
  cloudwatchMetricsEnabled: boolean
  metricName: string
}

export class CloudFrontWaf extends pulumi.ComponentResource implements CloudFrontWafResources {
  readonly acl: aws.wafv2.WebAcl
  readonly arn: pulumi.Output<string>

  constructor(name: string, args: CloudFrontWafArgs = {}, opts?: pulumi.ComponentResourceOptions) {
    super(SECURITY_WAF_COMPONENT_TYPE, name, {}, opts)

    const { rateLimit = 1000 } = args
    const baseName = resourceName(config, resourceNameSuffix.security.cloudfrontWaf)

    const visibility = (metricName: string): VisibilityConfig => ({
      sampledRequestsEnabled: true,
      cloudwatchMetricsEnabled: true,
      metricName
    })

    const rateLimitRule: aws.types.input.wafv2.WebAclRule = {
      name: 'rate-limit',
      priority: 1,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          limit: rateLimit,
          aggregateKeyType: 'IP'
        }
      },
      visibilityConfig: visibility('rate-limit')
    }

    this.acl = new aws.wafv2.WebAcl(
      baseName,
      {
        scope: 'CLOUDFRONT',
        region: 'us-east-1',
        defaultAction: { allow: {} },
        rules: [rateLimitRule],
        visibilityConfig: visibility('cloudfront-waf-main'),
        tags: createTags(config)
      },
      { parent: this }
    )

    this.arn = this.acl.arn
    this.registerOutputs({ arn: this.arn })
  }
}
