import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { config } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { commonTags } from '../tags'

export type CloudFrontWafProps = {
  name: string
  enableBotControl?: boolean
  rateLimit?: number
}

const SECURITY_WAF_COMPONENT_TYPE = 'boilerplate:edge:security:CloudFrontWaf'

export class CloudFrontWaf extends pulumi.ComponentResource {
  public readonly acl: aws.wafv2.WebAcl
  public readonly arn: pulumi.Output<string>

  constructor(name: string, props: CloudFrontWafProps, opts?: pulumi.ComponentResourceOptions) {
    super(SECURITY_WAF_COMPONENT_TYPE, name, {}, opts)

    const { enableBotControl = true, rateLimit = 1000 } = props

    this.acl = new aws.wafv2.WebAcl(
      resourceName(config, resourceNameSuffix.security.cloudfrontWaf),
      {
        scope: 'CLOUDFRONT',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'rate-limit',
            priority: 1,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: rateLimit,
                aggregateKeyType: 'IP'
              }
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'rate-limit'
            }
          },
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 10,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS'
              }
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'common-rule-set'
            }
          },
          {
            name: 'AWSManagedRulesSQLInjectionRuleSet',
            priority: 20,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesSQLInjectionRuleSet',
                vendorName: 'AWS'
              }
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'sql-injection'
            }
          },
          {
            name: 'AWSManagedRulesXSSRuleSet',
            priority: 30,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesXSSRuleSet',
                vendorName: 'AWS'
              }
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'xss'
            }
          },
          ...(enableBotControl
            ? [
                {
                  name: 'AWSManagedRulesBotControlRuleSet',
                  priority: 40,
                  overrideAction: { none: {} },
                  statement: {
                    managedRuleGroupStatement: {
                      name: 'AWSManagedRulesBotControlRuleSet',
                      vendorName: 'AWS'
                    }
                  },
                  visibilityConfig: {
                    sampledRequestsEnabled: true,
                    cloudwatchMetricsEnabled: true,
                    metricName: 'bot-control'
                  }
                }
              ]
            : [])
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: 'cloudfront-waf-main'
        },
        tags: { ...commonTags }
      },
      { parent: this }
    )

    this.arn = this.acl.arn
    this.registerOutputs({
      arn: this.arn
    })
  }
}
