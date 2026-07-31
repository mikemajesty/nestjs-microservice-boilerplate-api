import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import { config } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type CdnLogsBucketResources = {
  bucketId: pulumi.Output<string>
  bucketArn: pulumi.Output<string>
  bucketDomainName: pulumi.Output<string>
}

const CDN_LOGS_BUCKET_COMPONENT_TYPE = 'boilerplate:cdn:CdnLogsBucket'

export class CdnLogsBucket extends pulumi.ComponentResource implements CdnLogsBucketResources {
  readonly bucketId: pulumi.Output<string>
  readonly bucketArn: pulumi.Output<string>
  readonly bucketDomainName: pulumi.Output<string>

  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super(CDN_LOGS_BUCKET_COMPONENT_TYPE, name, {}, opts)

    const bucket = new aws.s3.Bucket(
      resourceName(config, resourceNameSuffix.s3.cdnLogsBucket),
      {
        forceDestroy: true,
        tags: createTags(config)
      },
      { parent: this }
    )

    const ownershipControls = new aws.s3.BucketOwnershipControls(
      resourceName(config, resourceNameSuffix.s3.cdnLogsBucketOwnership),
      {
        bucket: bucket.id,
        rule: { objectOwnership: 'BucketOwnerPreferred' }
      },
      { parent: this }
    )

    const bucketAcl = new aws.s3.BucketAcl(
      resourceName(config, resourceNameSuffix.s3.cdnLogsBucketAcl),
      {
        bucket: bucket.id,
        acl: 'log-delivery-write'
      },
      { parent: this, dependsOn: [ownershipControls] }
    )

    new aws.s3.BucketPolicy(
      resourceName(config, resourceNameSuffix.s3.cdnLogsBucketPolicy),
      {
        bucket: bucket.id,
        policy: pulumi.jsonStringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudFrontLogDelivery',
              Effect: 'Allow',
              Principal: { Service: 'cloudfront.amazonaws.com' },
              Action: 's3:PutObject',
              Resource: pulumi.interpolate`${bucket.arn}/*`
            },
            {
              Sid: 'AWSCloudFrontLogDeliveryAcl',
              Effect: 'Allow',
              Principal: { Service: 'cloudfront.amazonaws.com' },
              Action: ['s3:GetBucketAcl', 's3:PutBucketAcl'],
              Resource: bucket.arn
            }
          ]
        })
      },
      { parent: this, dependsOn: [bucketAcl] }
    )

    this.bucketId = bucket.id
    this.bucketArn = bucket.arn
    this.bucketDomainName = bucket.bucketDomainName

    this.registerOutputs({
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
      bucketDomainName: this.bucketDomainName
    })
  }
}
