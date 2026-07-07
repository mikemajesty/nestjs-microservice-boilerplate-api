import * as aws from '@pulumi/aws'
import * as docker from '@pulumi/docker'
import * as pulumi from '@pulumi/pulumi'

import type { InfrastructureConfig } from '../config'
import { resourceName, ResourceNameSuffix } from '../names'
import { createTags } from '../tags'

export type ApplicationContainerRegistryResources = {
  appImageName: pulumi.Output<string>
  appImageRepoDigest: pulumi.Output<string>
  appRepositoryArn: pulumi.Output<string>
  appRepositoryName: pulumi.Output<string>
  appRepositoryUrl: pulumi.Output<string>
}

export type ApplicationContainerRegistryArgs = {
  config: InfrastructureConfig
}

const APPLICATION_CONTAINER_REGISTRY_COMPONENT_TYPE = 'boilerplate:app:ContainerRegistry'
const ECR_PUBLIC_MANAGEMENT_REGION = 'us-east-1'

export class ApplicationContainerRegistry
  extends pulumi.ComponentResource
  implements ApplicationContainerRegistryResources
{
  readonly appImageName: pulumi.Output<string>
  readonly appImageRepoDigest: pulumi.Output<string>
  readonly appRepositoryArn: pulumi.Output<string>
  readonly appRepositoryName: pulumi.Output<string>
  readonly appRepositoryUrl: pulumi.Output<string>

  constructor(name: string, args: ApplicationContainerRegistryArgs, opts?: pulumi.ComponentResourceOptions) {
    super(APPLICATION_CONTAINER_REGISTRY_COMPONENT_TYPE, name, {}, opts)

    const { config } = args
    const appRepositoryName = resourceName(config, ResourceNameSuffix.APPLICATION_CONTAINER_REPOSITORY)
    const appRepository = new aws.ecrpublic.Repository(
      appRepositoryName,
      {
        repositoryName: appRepositoryName,
        forceDestroy: true,
        region: ECR_PUBLIC_MANAGEMENT_REGION,
        tags: createTags(config, {
          Name: appRepositoryName
        })
      },
      { parent: this }
    )

    this.appRepositoryArn = appRepository.arn
    this.appRepositoryName = appRepository.repositoryName
    this.appRepositoryUrl = appRepository.repositoryUri

    const authToken = aws.ecrpublic.getAuthorizationTokenOutput({ region: ECR_PUBLIC_MANAGEMENT_REGION })
    const appImage = new docker.Image(
      `${appRepositoryName}-image`,
      {
        build: {
          context: '..',
          dockerfile: '../Dockerfile',
          platform: 'linux/amd64'
        },
        imageName: pulumi.interpolate`${appRepository.repositoryUri}:${config.appImageTag}`,
        registry: {
          password: pulumi.secret(authToken.password),
          server: appRepository.repositoryUri,
          username: authToken.userName
        }
      },
      { parent: this }
    )

    this.appImageName = appImage.imageName
    this.appImageRepoDigest = appImage.repoDigest

    this.registerOutputs({
      appImageName: this.appImageName,
      appImageRepoDigest: this.appImageRepoDigest,
      appRepositoryArn: this.appRepositoryArn,
      appRepositoryName: this.appRepositoryName,
      appRepositoryUrl: this.appRepositoryUrl
    })
  }
}
