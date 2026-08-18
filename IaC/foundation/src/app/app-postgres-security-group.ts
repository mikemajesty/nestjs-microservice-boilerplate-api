import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationPostgresSecurityGroupResources = {
  postgresSecurityGroupId: pulumi.Output<string>
}

export type ApplicationPostgresSecurityGroupArgs = {
  config: InfrastructureConfig
  vpcId: pulumi.Input<string>
  clusterSecurityGroupId: pulumi.Input<string>
  karpenterNodeSecurityGroupId: pulumi.Input<string>
}

const APPLICATION_POSTGRES_SECURITY_GROUP_COMPONENT_TYPE = 'boilerplate:app:PostgresSecurityGroup'
const POSTGRES_PORT = 5432
const TCP_PROTOCOL = 'tcp'

export class ApplicationPostgresSecurityGroup
  extends pulumi.ComponentResource
  implements ApplicationPostgresSecurityGroupResources
{
  readonly postgresSecurityGroupId: pulumi.Output<string>

  constructor(name: string, args: ApplicationPostgresSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_POSTGRES_SECURITY_GROUP_COMPONENT_TYPE, name, {}, opts)

    const { config, vpcId, clusterSecurityGroupId, karpenterNodeSecurityGroupId } = args
    const postgresSecurityGroupName = resourceName(config, resourceNameSuffix.app.postgresSecurityGroup)

    const postgresSecurityGroup = new aws.ec2.SecurityGroup(
      postgresSecurityGroupName,
      {
        vpcId,
        ingress: [],
        egress: [],
        tags: createTags(config, {
          Name: postgresSecurityGroupName
        })
      },
      { parent: this }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-postgres-from-cluster-ingress'),
      {
        securityGroupId: postgresSecurityGroup.id,
        referencedSecurityGroupId: clusterSecurityGroupId,
        fromPort: POSTGRES_PORT,
        toPort: POSTGRES_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow PostgreSQL traffic from the EKS cluster security group'
      },
      { parent: postgresSecurityGroup }
    )

    new aws.vpc.SecurityGroupIngressRule(
      resourceName(config, 'app-postgres-from-karpenter-ingress'),
      {
        securityGroupId: postgresSecurityGroup.id,
        referencedSecurityGroupId: karpenterNodeSecurityGroupId,
        fromPort: POSTGRES_PORT,
        toPort: POSTGRES_PORT,
        ipProtocol: TCP_PROTOCOL,
        description: 'Allow PostgreSQL traffic from the Karpenter node security group'
      },
      { parent: postgresSecurityGroup }
    )

    this.postgresSecurityGroupId = postgresSecurityGroup.id

    this.registerOutputs({
      postgresSecurityGroupId: this.postgresSecurityGroupId
    })
  }
}
