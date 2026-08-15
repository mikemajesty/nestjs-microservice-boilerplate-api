import * as pulumi from '@pulumi/pulumi'

import { ArgoCd } from './src/addon/addon-argocd'
import { ArgoCdRootApplication } from './src/addon/addon-argocd-root-application'
import { AwsLoadBalancerController } from './src/addon/addon-aws-load-balancer-controller'
import { AwsLoadBalancerControllerIam } from './src/addon/addon-aws-load-balancer-controller-iam'
import { ExternalDns } from './src/addon/addon-external-dns'
import { ExternalDnsIam } from './src/addon/addon-external-dns-iam'
import { ExternalSecretsIam } from './src/addon/addon-external-secrets-iam'
import { K8sConfigMap } from './src/addon/addon-k8s-configmap'
import { KarpenterIam } from './src/addon/addon-karpenter-iam'
import { SsmAnnotationResolver } from './src/addon/addon-ssm-annotation-resolver'
import { SsmAnnotationResolverIam } from './src/addon/addon-ssm-annotation-resolver-iam'
import { ApplicationContainerRegistry } from './src/app/app-container-registry'
import { ApplicationRuntimeSecret } from './src/app/app-runtime-secret'
import { ConfigMapK8sProvider } from './src/cluster/cluster-configmap-provider'
import { EksCluster } from './src/cluster/cluster-eks'
import { EksClusterIam } from './src/cluster/cluster-eks-iam'
import { EksNodeGroup } from './src/cluster/cluster-eks-node-group'
import { EksNodeIam } from './src/cluster/cluster-eks-node-iam'
import { EksOidcProvider } from './src/cluster/cluster-oidc-provider'
import { config } from './src/config'
import { InternalDns } from './src/dns/dns-private-zone'
import { resourceName, resourceNameSuffix } from './src/names'
import { KarpenterNodeSecurityGroups } from './src/network/network-karpenter-node-security-groups'
import { NlbParameterStore } from './src/network/network-nlb-parameter-store'
import { NetworkSecurityGroups } from './src/network/network-nlb-security-groups'
import { VPCNetwork } from './src/network/network-vpc'
import { WorkloadK8sProvider } from './src/workload/workload-k8s-provider'

// ============================================================
// 1. NETWORK
// ============================================================
const network = new VPCNetwork(resourceName(config, resourceNameSuffix.network.vpcNetwork), { config })

// ============================================================
// 2. NETWORK SECURITY GROUPS
// ============================================================
const networkSecurityGroup = new NetworkSecurityGroups(
  resourceName(config, resourceNameSuffix.network.securityGroups),
  {
    config,
    vpcId: network.vpcId,
    vpcCidr: network.vpcCidr
  },
  { parent: network }
)

// ============================================================
// 3. DNS
// ============================================================
const internalDns = new InternalDns(resourceName(config, resourceNameSuffix.dns.internal), {
  config,
  vpcId: network.vpcId
})

// ============================================================
// 4. APPLICATION
// ============================================================
const applicationContainerRegistry = config.enableAppContainerRegistry
  ? new ApplicationContainerRegistry(resourceName(config, resourceNameSuffix.app.containerRegistry), { config })
  : undefined

const applicationRuntimeSecret = new ApplicationRuntimeSecret(
  resourceName(config, resourceNameSuffix.app.runtimeSecret),
  { config }
)

// ============================================================
// 5. EKS CLUSTER
// ============================================================
const eksClusterIam = new EksClusterIam(resourceName(config, resourceNameSuffix.cluster.eks.iam), { config })

const eksCluster = new EksCluster(
  resourceName(config, resourceNameSuffix.cluster.eks.cluster),
  {
    config,
    clusterRoleArn: eksClusterIam.clusterRoleArn,
    subnetIds: network.privateSubnetIds
  },
  {
    customTimeouts: { delete: '30m' },
    dependsOn: [network, eksClusterIam]
  }
)

const karpenterNodeSecurityGroup = new KarpenterNodeSecurityGroups(
  resourceName(config, resourceNameSuffix.network.karpenterNodeSecurityGroup),
  {
    config,
    vpcId: network.vpcId,
    clusterSecurityGroupId: eksCluster.clusterSecurityGroupId
  },
  { parent: network }
)

// ============================================================
// 6. EKS OIDC PROVIDER
// ============================================================
const eksOidcProvider = new EksOidcProvider(resourceName(config, resourceNameSuffix.cluster.eks.oidcProvider), {
  config,
  clusterOidcIssuerUrl: eksCluster.clusterOidcIssuerUrl
})

// ============================================================
// 7. EKS NODE GROUP
// ============================================================
const eksNodeIam = new EksNodeIam(resourceName(config, resourceNameSuffix.cluster.eks.nodeIam), { config })

const eksNodeGroup = new EksNodeGroup(
  resourceName(config, resourceNameSuffix.cluster.eks.nodeGroup),
  {
    config,
    clusterName: eksCluster.clusterName,
    nodeRoleArn: eksNodeIam.nodeRoleArn,
    subnetIds: network.privateSubnetIds
  },
  {
    customTimeouts: { delete: '30m' },
    dependsOn: [eksCluster, eksNodeIam]
  }
)

// ============================================================
// 8. CONFIGMAP K8S PROVIDER (ESPECÍFICO PARA CONFIGMAPS)
// ============================================================
const configMapK8sProvider = new ConfigMapK8sProvider(
  resourceName(config, 'configmap-provider'),
  {
    config,
    clusterCertificateAuthorityData: eksCluster.clusterCertificateAuthorityData,
    clusterEndpoint: eksCluster.clusterEndpoint,
    clusterName: eksCluster.clusterName
  },
  {
    dependsOn: [eksCluster, eksNodeGroup],
    customTimeouts: { create: '15m', delete: '15m' }
  }
)

// ============================================================
// 9. K8S CONFIGMAP - AWS AUTH
// ============================================================
new K8sConfigMap(
  resourceName(config, 'aws-auth'),
  {
    config,
    provider: configMapK8sProvider.provider,
    namespace: 'kube-system',
    name: 'aws-auth',
    data: {
      mapRoles: pulumi.interpolate`- rolearn: ${eksNodeIam.nodeRoleArn}
        username: system:node:{{EC2PrivateDNSName}}
        groups:
          - system:bootstrappers
          - system:nodes`
    }
  },
  {
    dependsOn: [eksCluster, eksNodeGroup, configMapK8sProvider]
  }
)

// ============================================================
// 10. WORKLOAD K8S PROVIDER
// ============================================================
const workloadK8sProvider = new WorkloadK8sProvider(
  resourceName(config, resourceNameSuffix.workload.k8sProvider),
  {
    config,
    clusterCertificateAuthorityData: eksCluster.clusterCertificateAuthorityData,
    clusterEndpoint: eksCluster.clusterEndpoint,
    clusterName: eksCluster.clusterName
  },
  {
    dependsOn: [eksCluster, eksNodeGroup]
  }
)

// ============================================================
// 11. SSM — persiste o SG ID do NLB como fonte de verdade AWS
// ============================================================
const nlbParameterStore = new NlbParameterStore(
  resourceName(config, resourceNameSuffix.network.nlbParameterStore),
  {
    config,
    envoyNlbSecurityGroupId: networkSecurityGroup.envoyInternalNlbSecurityGroupId
  },
  { dependsOn: [networkSecurityGroup] }
)

// ============================================================
// 12. IAM ROLES FOR ADDONS
// ============================================================
const awsLoadBalancerControllerIam = new AwsLoadBalancerControllerIam(
  resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.iam),
  {
    config,
    oidcProviderArn: eksOidcProvider.oidcProviderArn,
    oidcProviderUrl: eksOidcProvider.oidcProviderUrl
  }
)

const externalDnsIam = new ExternalDnsIam(resourceName(config, resourceNameSuffix.addon.externalDns.iam), {
  config,
  oidcProviderArn: eksOidcProvider.oidcProviderArn,
  oidcProviderUrl: eksOidcProvider.oidcProviderUrl,
  privateHostedZoneId: internalDns.privateHostedZoneId
})

const externalSecretsIam = new ExternalSecretsIam(resourceName(config, resourceNameSuffix.addon.externalSecrets.iam), {
  config,
  oidcProviderArn: eksOidcProvider.oidcProviderArn,
  oidcProviderUrl: eksOidcProvider.oidcProviderUrl,
  runtimeSecretArn: applicationRuntimeSecret.secretArn,
  infraSsmParameterArn: nlbParameterStore.envoyNlbSgIdParameterArn
})

const karpenterIam = new KarpenterIam(resourceName(config, 'karpenter-iam'), {
  config,
  clusterName: eksCluster.clusterName,
  oidcProviderArn: eksOidcProvider.oidcProviderArn,
  oidcProviderUrl: eksOidcProvider.oidcProviderUrl,
  nodeRoleArn: eksNodeIam.nodeRoleArn
})

// ============================================================
// 13. ADDONS (USAM O WORKLOAD PROVIDER)
// ============================================================
const awsLoadBalancerController = new AwsLoadBalancerController(
  resourceName(config, resourceNameSuffix.addon.awsLoadBalancerController.release),
  {
    clusterName: eksCluster.clusterName,
    config,
    provider: workloadK8sProvider.provider,
    roleArn: awsLoadBalancerControllerIam.roleArn,
    serviceAccountName: awsLoadBalancerControllerIam.serviceAccountName,
    serviceAccountNamespace: awsLoadBalancerControllerIam.serviceAccountNamespace,
    vpcId: network.vpcId
  },
  { dependsOn: [eksNodeGroup, workloadK8sProvider] }
)

const argoCd = new ArgoCd(
  resourceName(config, resourceNameSuffix.addon.argoCd.release),
  {
    config,
    provider: workloadK8sProvider.provider
  },
  { dependsOn: [eksNodeGroup, workloadK8sProvider, awsLoadBalancerController] }
)

const externalDns = new ExternalDns(
  resourceName(config, resourceNameSuffix.addon.externalDns.release),
  {
    config,
    provider: workloadK8sProvider.provider,
    roleArn: externalDnsIam.roleArn,
    serviceAccountName: externalDnsIam.serviceAccountName,
    serviceAccountNamespace: externalDnsIam.serviceAccountNamespace
  },
  { dependsOn: [eksNodeGroup, workloadK8sProvider] } // 👈 ADICIONADO WORKLOAD PROVIDER
)

const ssmAnnotationResolverIam = new SsmAnnotationResolverIam(
  resourceName(config, resourceNameSuffix.addon.ssmAnnotationResolver.iam),
  {
    config,
    oidcProviderArn: eksOidcProvider.oidcProviderArn,
    oidcProviderUrl: eksOidcProvider.oidcProviderUrl
  },
  { dependsOn: [eksNodeGroup, eksOidcProvider] }
)

const argoCdRootApplication = new ArgoCdRootApplication(
  resourceName(config, resourceNameSuffix.addon.argoCd.rootApplication),
  {
    config,
    namespaceName: argoCd.namespaceName,
    provider: workloadK8sProvider.provider
  },
  // argoCd.release ensures the Helm chart (and its CRDs) are fully applied
  // before Pulumi tries to create the argoproj.io/v1alpha1 Application resource.
  { dependsOn: [argoCd.release, workloadK8sProvider, ssmAnnotationResolverIam] }
)

// ============================================================
// 14. SSM ANNOTATION RESOLVER (CRD-driven infrastructure provisioning)
// ============================================================
// Creates a Kubernetes CustomResource that instructs the SSM Annotation Resolver
// controller to provision SQS/DLQ inside the cluster reconciliation flow.
// The controller IRSA role is created in Foundation to avoid bootstrap cycles.
// Foundation then creates the EventBridge rule, target, and queue policy once
// the CRD reports status.phase=Ready and exposes the queue outputs.
const ssmAnnotationResolver = new SsmAnnotationResolver(
  resourceName(config, 'ssm-annotation-resolver'),
  {
    config,
    ssmParameterName: nlbParameterStore.envoyNlbSgIdParameterName,
    workloadK8sProvider,
    namespace: 'envoy-gateway-system'
  },
  { dependsOn: [workloadK8sProvider, argoCdRootApplication] }
)

// ============================================================
// 15. EXPORTS
// ============================================================
export const vpc = {
  id: network.vpcId,
  publicSubnetIds: network.publicSubnetIds,
  privateSubnetIds: network.privateSubnetIds,
  internetGatewayId: network.internetGatewayId,
  natGatewayId: network.natGatewayId
}

export const securityGroups = {
  publicLoadBalancerSecurityGroupId: networkSecurityGroup.envoyInternalNlbSecurityGroupId,
  karpenterNodeSecurityGroupId: karpenterNodeSecurityGroup.karpenterNodeSecurityGroupId
}

export const infraConfig = {
  envoyNlbSgIdParameterName: nlbParameterStore.envoyNlbSgIdParameterName,
  envoyNlbSgIdParameterArn: nlbParameterStore.envoyNlbSgIdParameterArn
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

export const application = {
  runtimeSecretArn: applicationRuntimeSecret.secretArn,
  runtimeSecretName: applicationRuntimeSecret.secretName
}

export const eks = {
  clusterArn: eksCluster.clusterArn,
  clusterCertificateAuthorityData: eksCluster.clusterCertificateAuthorityData,
  clusterEndpoint: eksCluster.clusterEndpoint,
  clusterName: eksCluster.clusterName,
  clusterOidcIssuerUrl: eksCluster.clusterOidcIssuerUrl,
  clusterSecurityGroupId: eksCluster.clusterSecurityGroupId,
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
  externalDnsServiceAccountNamespace: externalDnsIam.serviceAccountNamespace,
  externalSecretsPolicyArn: externalSecretsIam.policyArn,
  externalSecretsPolicyName: externalSecretsIam.policyName,
  externalSecretsRoleArn: externalSecretsIam.roleArn,
  externalSecretsRoleName: externalSecretsIam.roleName,
  externalSecretsServiceAccountName: externalSecretsIam.serviceAccountName,
  externalSecretsServiceAccountNamespace: externalSecretsIam.serviceAccountNamespace,
  karpenterRoleArn: karpenterIam.roleArn,
  karpenterRoleName: karpenterIam.roleName,
  karpenterServiceAccountName: karpenterIam.serviceAccountName,
  karpenterServiceAccountNamespace: karpenterIam.serviceAccountNamespace,
  ssmAnnotationResolverPolicyArn: ssmAnnotationResolverIam.policyArn,
  ssmAnnotationResolverPolicyName: ssmAnnotationResolverIam.policyName,
  ssmAnnotationResolverRoleArn: ssmAnnotationResolverIam.roleArn,
  ssmAnnotationResolverRoleName: ssmAnnotationResolverIam.roleName,
  ssmAnnotationResolverSqsQueueUrl: ssmAnnotationResolver.sqsQueueUrl,
  ssmAnnotationResolverSqsQueueArn: ssmAnnotationResolver.sqsQueueArn,
  ssmAnnotationResolverDlqQueueUrl: ssmAnnotationResolver.dlqQueueUrl,
  ssmAnnotationResolverDlqQueueArn: ssmAnnotationResolver.dlqQueueArn,
  ssmAnnotationResolverServiceAccountName: ssmAnnotationResolverIam.serviceAccountName,
  ssmAnnotationResolverServiceAccountNamespace: ssmAnnotationResolverIam.serviceAccountNamespace,
  ssmAnnotationResolverEventBridgeRuleArn: ssmAnnotationResolver.eventBridgeRuleArn
}

export const workload = {}
