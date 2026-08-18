import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationMongoSecurityGroupResources = {
  mongoSecurityGroupId: pulumi.Output<string>
}

export type ApplicationMongoSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
  clusterSecurityGroupId: pulumi.Input<string>
  karpenterNodeSecurityGroupId: pulumi.Input<string>
}

const APPLICATION_MONGO_SECURITY_GROUP_COMPONENT_TYPE = 'boilerplate:app:MongoSecurityGroup'
const MONGO_PORT = 27017
const TCP_PROTOCOL = 'tcp'

export class ApplicationMongoSecurityGroup
  extends pulumi.ComponentResource
  implements ApplicationMongoSecurityGroupResources
{
  readonly mongoSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: ApplicationMongoSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_MONGO_SECURITY_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId, clusterSecurityGroupId, karpenterNodeSecurityGroupId } = args
    const mongoSecurityGroupName = resourceName(config, resourceNameSuffix.app.mongoSecurityGroup)

    const mongoSecurityGroup = new aws.ec2.SecurityGroup(
      mongoSecurityGroupName,
      {
        vpcId,
        ingress: [],
        egress: [],
        tags: createTags(config, {
          Name: mongoSecurityGroupName
        })
      },
      { parent: this }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-mongo-from-cluster-ingress'),
      {
        securityGroupId: mongoSecurityGroup.id,
        referencedSecurityGroupId: clusterSecurityGroupId,
        fromPort: MONGO_PORT,
        toPort: MONGO_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow DocumentDB traffic from the EKS cluster security group'
      },
      { parent: mongoSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-mongo-from-karpenter-ingress'),
      {
        securityGroupId: mongoSecurityGroup.id,
        referencedSecurityGroupId: karpenterNodeSecurityGroupId,
        fromPort: MONGO_PORT,
        toPort: MONGO_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow DocumentDB traffic from the Karpenter node security group'
      },
      { parent: mongoSecurityGroup }
    )

    this.mongoSecurityGroupId = mongoSecurityGroup.id

    this.registerOutputs({
      mongoSecurityGroupId: this.mongoSecurityGroupId
    })
  }
}
