import { ArgoCd } from './src/addon/addon-argocd'
import { ArgoCdRootApplication } from './src/addon/addon-argocd-root-application'
import { AwsLoadBalancerController } from './src/addon/addon-aws-load-balancer-controller'
import { AwsLoadBalancerControllerIam } from './src/addon/addon-aws-load-balancer-controller-iam'
import { ExternalDns } from './src/addon/addon-external-dns'
import { ExternalDnsIam } from './src/addon/addon-external-dns-iam'
import { ApplicationContainerRegistry } from './src/app/app-container-registry'
import { EksCluster } from './src/cluster/cluster-eks'
import { EksClusterIam } from './src/cluster/cluster-eks-iam'
import { EksNodeGroup } from './src/cluster/cluster-eks-node-group'
import { EksNodeIam } from './src/cluster/cluster-eks-node-iam'
import { EksOidcProvider } from './src/cluster/cluster-oidc-provider'
import { config } from './src/config'
import { InternalDns } from './src/dns/dns-private-zone'
import { resourceName, ResourceNameSuffix } from './src/names'
import { NetworkSecurityGroups } from './src/network/network-security-groups'
import { VPCNetwork } from './src/network/network-vpc'
import { WorkloadK8sProvider } from './src/workload/workload-k8s-provider'

const network = new VPCNetwork(resourceName(config, ResourceNameSuffix.VPC_NETWORK), { config })
const networkSecurityGroups = new NetworkSecurityGroups(
  resourceName(config, ResourceNameSuffix.NETWORK_SECURITY_GROUPS),
  {
    config,
    vpcId: network.vpcId
  }
)
const internalDns = new InternalDns(resourceName(config, ResourceNameSuffix.INTERNAL_DNS), {
  config,
  vpcId: network.vpcId
})
const applicationContainerRegistry = config.enableAppContainerRegistry
  ? new ApplicationContainerRegistry(resourceName(config, ResourceNameSuffix.APPLICATION_CONTAINER_REGISTRY), {
      config
    })
  : undefined
const eksClusterIam = new EksClusterIam(resourceName(config, ResourceNameSuffix.EKS_CLUSTER_IAM), { config })
const eksCluster = new EksCluster(resourceName(config, ResourceNameSuffix.EKS_CLUSTER), {
  config,
  clusterRoleArn: eksClusterIam.clusterRoleArn,
  subnetIds: network.privateSubnetIds
})
const eksOidcProvider = new EksOidcProvider(resourceName(config, ResourceNameSuffix.EKS_CLUSTER_OIDC_PROVIDER), {
  config,
  clusterOidcIssuerUrl: eksCluster.clusterOidcIssuerUrl
})
const awsLoadBalancerControllerIam = new AwsLoadBalancerControllerIam(
  resourceName(config, ResourceNameSuffix.AWS_LOAD_BALANCER_CONTROLLER_IAM),
  {
    config,
    oidcProviderArn: eksOidcProvider.oidcProviderArn,
    oidcProviderUrl: eksOidcProvider.oidcProviderUrl
  }
)
const externalDnsIam = new ExternalDnsIam(resourceName(config, ResourceNameSuffix.EXTERNAL_DNS_IAM), {
  config,
  oidcProviderArn: eksOidcProvider.oidcProviderArn,
  oidcProviderUrl: eksOidcProvider.oidcProviderUrl,
  privateHostedZoneId: internalDns.privateHostedZoneId
})
const eksNodeIam = new EksNodeIam(resourceName(config, ResourceNameSuffix.EKS_NODE_IAM), { config })
const eksNodeGroup = new EksNodeGroup(resourceName(config, ResourceNameSuffix.EKS_NODE_GROUP), {
  config,
  clusterName: eksCluster.clusterName,
  nodeRoleArn: eksNodeIam.nodeRoleArn,
  subnetIds: network.privateSubnetIds
})
const workloadK8sProvider = new WorkloadK8sProvider(resourceName(config, ResourceNameSuffix.WORKLOAD_K8S_PROVIDER), {
  config,
  clusterCertificateAuthorityData: eksCluster.clusterCertificateAuthorityData,
  clusterEndpoint: eksCluster.clusterEndpoint,
  clusterName: eksCluster.clusterName
})
const awsLoadBalancerController = new AwsLoadBalancerController(
  resourceName(config, ResourceNameSuffix.AWS_LOAD_BALANCER_CONTROLLER),
  {
    clusterName: eksCluster.clusterName,
    config,
    provider: workloadK8sProvider.provider,
    roleArn: awsLoadBalancerControllerIam.roleArn,
    serviceAccountName: awsLoadBalancerControllerIam.serviceAccountName,
    serviceAccountNamespace: awsLoadBalancerControllerIam.serviceAccountNamespace,
    vpcId: network.vpcId
  },
  { dependsOn: [eksNodeGroup.nodeGroup] }
)
const argoCd = new ArgoCd(
  resourceName(config, ResourceNameSuffix.ARGOCD),
  {
    config,
    provider: workloadK8sProvider.provider
  },
  { dependsOn: [eksNodeGroup.nodeGroup] }
)
const externalDns = new ExternalDns(
  resourceName(config, ResourceNameSuffix.EXTERNAL_DNS),
  {
    config,
    provider: workloadK8sProvider.provider,
    roleArn: externalDnsIam.roleArn,
    serviceAccountName: externalDnsIam.serviceAccountName,
    serviceAccountNamespace: externalDnsIam.serviceAccountNamespace
  },
  { dependsOn: [eksNodeGroup.nodeGroup] }
)
const argoCdRootApplication = new ArgoCdRootApplication(
  resourceName(config, ResourceNameSuffix.ARGOCD_ROOT_APPLICATION),
  {
    config,
    namespaceName: argoCd.namespaceName,
    provider: workloadK8sProvider.provider
  },
  { dependsOn: [argoCd.release] }
)

export const vpc = {
  id: network.vpcId,
  publicSubnetIds: network.publicSubnetIds,
  privateSubnetIds: network.privateSubnetIds,
  internetGatewayId: network.internetGatewayId,
  natGatewayId: network.natGatewayId
}

export const securityGroups = {
  publicLoadBalancerSecurityGroupId: networkSecurityGroups.publicLoadBalancerSecurityGroupId
}

export const dns = {
  privateHostedZoneId: internalDns.privateHostedZoneId,
  internalDomainName: internalDns.internalDomainName
}

export const containerRegistry = applicationContainerRegistry
  ? {
      enabled: true,
      appImageName: applicationContainerRegistry.appImageName,
      appImageRepoDigest: applicationContainerRegistry.appImageRepoDigest,
      appImageRepository: applicationContainerRegistry.appRepositoryUrl,
      appImageTag: config.appImageTag,
      appRepositoryArn: applicationContainerRegistry.appRepositoryArn,
      appRepositoryName: applicationContainerRegistry.appRepositoryName,
      appRepositoryUrl: applicationContainerRegistry.appRepositoryUrl
    }
  : {
      enabled: false,
      appImageTag: config.appImageTag
    }

export const eks = {
  clusterArn: eksCluster.clusterArn,
  clusterCertificateAuthorityData: eksCluster.clusterCertificateAuthorityData,
  clusterEndpoint: eksCluster.clusterEndpoint,
  clusterName: eksCluster.clusterName,
  clusterOidcIssuerUrl: eksCluster.clusterOidcIssuerUrl,
  clusterRoleArn: eksClusterIam.clusterRoleArn,
  clusterRoleName: eksClusterIam.clusterRoleName,
  nodeGroupArn: eksNodeGroup.nodeGroupArn,
  nodeGroupName: eksNodeGroup.nodeGroupName,
  nodeGroupStatus: eksNodeGroup.nodeGroupStatus,
  nodeRoleArn: eksNodeIam.nodeRoleArn,
  nodeRoleName: eksNodeIam.nodeRoleName,
  oidcProviderArn: eksOidcProvider.oidcProviderArn,
  oidcProviderUrl: eksOidcProvider.oidcProviderUrl
}

export const addons = {
  argoCdRootApplicationName: argoCdRootApplication.applicationName,
  argoCdNamespaceName: argoCd.namespaceName,
  argoCdReleaseName: argoCd.releaseName,
  awsLoadBalancerControllerPolicyArn: awsLoadBalancerControllerIam.policyArn,
  awsLoadBalancerControllerPolicyName: awsLoadBalancerControllerIam.policyName,
  awsLoadBalancerControllerRoleArn: awsLoadBalancerControllerIam.roleArn,
  awsLoadBalancerControllerRoleName: awsLoadBalancerControllerIam.roleName,
  awsLoadBalancerControllerReleaseName: awsLoadBalancerController.releaseName,
  awsLoadBalancerControllerServiceAccountName: awsLoadBalancerControllerIam.serviceAccountName,
  awsLoadBalancerControllerServiceAccountNamespace: awsLoadBalancerControllerIam.serviceAccountNamespace,
  externalDnsPolicyArn: externalDnsIam.policyArn,
  externalDnsPolicyName: externalDnsIam.policyName,
  externalDnsReleaseName: externalDns.releaseName,
  externalDnsRoleArn: externalDnsIam.roleArn,
  externalDnsRoleName: externalDnsIam.roleName,
  externalDnsServiceAccountName: externalDnsIam.serviceAccountName,
  externalDnsServiceAccountNamespace: externalDnsIam.serviceAccountNamespace
}

export const workload = {}
