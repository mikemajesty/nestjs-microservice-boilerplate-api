import * as aws from '@pulumi/aws'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, resourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type NlbParameterStoreResources = {
  envoyNlbSgIdParameterName: pulumi.Output<string>
  envoyNlbSgIdParameterArn: pulumi.Output<string>
}

export type NlbParameterStoreArgs = {
  config: InfrastructureConfig
  envoyNlbSecurityGroupId: pulumi.Input<string>
}

const NLB_PARAMETER_STORE_COMPONENT_TYPE = 'boilerplate:network:NlbParameterStore'

export class NlbParameterStore extends pulumi.ComponentResource implements NlbParameterStoreResources {
  readonly envoyNlbSgIdParameterName: pulumi.Output<string>
  readonly envoyNlbSgIdParameterArn: pulumi.Output<string>

  constructor(name: string, args: NlbParameterStoreArgs, opts?: pulumi.ComponentResourceOptions) {
    super(NLB_PARAMETER_STORE_COMPONENT_TYPE, name, {}, opts)

    const { config, envoyNlbSecurityGroupId } = args

    // Parameter path: /{projectName}/{environment}/infra/envoy-nlb-sg-id
    // Written here so CI/CD and ESO can read without depending on Pulumi state.
    const parameterName = `/${config.projectName}/${config.environment}${resourceNameSuffix.network.nlbSgIdPath}`

    const parameter = new aws.ssm.Parameter(
      resourceName(config, resourceNameSuffix.network.nlbParameterStore),
      {
        name: parameterName,
        type: 'String',
        value: envoyNlbSecurityGroupId,
        description: 'Envoy Gateway internal NLB security group ID — consumed by GitOps/ESO',
        tags: createTags(config)
      },
      { parent: this }
    )

    this.envoyNlbSgIdParameterName = parameter.name
    this.envoyNlbSgIdParameterArn = parameter.arn

    this.registerOutputs({
      envoyNlbSgIdParameterName: this.envoyNlbSgIdParameterName,
      envoyNlbSgIdParameterArn: this.envoyNlbSgIdParameterArn
    })
  }
}
