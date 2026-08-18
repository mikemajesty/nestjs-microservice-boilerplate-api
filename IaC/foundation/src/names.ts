import type { InfrastructureConfig } from './config'

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const resourceNameSuffix = {
  network: {
    vpc: 'vpc',
    vpcNetwork: 'vpc-network',
    securityGroups: 'network-security-groups',
    nlbSecurityGroup: 'private-nlb-sg',
    karpenterNodeSecurityGroup: 'karpenter-node-sg',
    nlbParameterStore: 'nlb-parameter-store',
    nlbSgIdPath: '/infra/envoy-nlb-sg-id',
    envoyNlbHttpIngress: 'envoy-nlb-http-ingress',
    envoyNlbHttpsIngress: 'envoy-nlb-https-ingress',
    envoyNlbEgress: 'envoy-nlb-egress',
    envoyNlbHealthCheck: 'envoy-nlb-health-check'
  },
  dns: {
    internal: 'internal-dns',
    privateHostedZone: 'private-hosted-zone'
  },
  app: {
    containerRegistry: 'app-container-registry',
    containerRepository: 'app',
    containerRepositoryLifecyclePolicy: 'app-ecr-lifecycle-policy',
    runtimeSecret: 'app-runtime-secret',
    runtimeSecretVersion: 'app-runtime-secret-version',
    postgres: 'app-postgres',
    postgresPassword: 'app-postgres-password',
    postgresSecurityGroup: 'app-postgres-sg',
    postgresSubnetGroup: 'app-postgres-subnet-group',
    redis: 'app-redis',
    redisAuthToken: 'app-redis-auth-token',
    redisSecurityGroup: 'app-redis-sg',
    redisSubnetGroup: 'app-redis-subnet-group',
    mongo: 'app-mongo',
    mongoPassword: 'app-mongo-password',
    mongoSecurityGroup: 'app-mongo-sg',
    mongoSubnetGroup: 'app-mongo-subnet-group',
    mongoParameterGroup: 'app-mongo-parameter-group',
    mongoInstance: 'app-mongo-instance'
  },
  cluster: {
    eks: {
      cluster: 'eks-cluster',
      iam: 'eks-cluster-iam',
      oidcProvider: 'eks-cluster-oidc-provider',
      role: 'eks-cluster-role',
      rolePolicyAttachment: 'eks-cluster-role-policy-attachment',
      nodeIam: 'eks-node-iam',
      nodeRole: 'eks-node-role',
      nodeWorkerPolicyAttachment: 'eks-node-worker-policy-attachment',
      nodeCniPolicyAttachment: 'eks-node-cni-policy-attachment',
      nodeEcrPolicyAttachment: 'eks-node-ecr-policy-attachment',
      nodeEcrPublicPolicyAttachment: 'eks-node-ecr-public-policy-attachment',
      nodeSsmManagedInstancePolicyAttachment: 'eks-node-ssm-managed-instance-policy-attachment',
      nodeSsmPatchPolicyAttachment: 'eks-node-ssm-patch-policy-attachment',
      nodeGroup: 'eks-node-group'
    }
  },
  addon: {
    awsLoadBalancerController: {
      iam: 'aws-load-balancer-controller-iam',
      release: 'aws-load-balancer-controller',
      policy: 'aws-load-balancer-controller-policy',
      role: 'aws-load-balancer-controller-role',
      policyAttachment: 'aws-load-balancer-controller-policy-attachment'
    },
    karpenter: {
      release: 'karpenter',
      role: 'karpenter-role',
      nodeLifecyclePolicy: 'karpenter-controller-node-lifecycle-policy',
      iamIntegrationPolicy: 'karpenter-controller-iam-integration-policy',
      eksIntegrationPolicy: 'karpenter-controller-eks-integration-policy',
      resourceDiscoveryPolicy: 'karpenter-controller-resource-discovery-policy'
    },
    externalDns: {
      iam: 'external-dns-iam',
      release: 'external-dns',
      policy: 'external-dns-policy',
      role: 'external-dns-role',
      policyAttachment: 'external-dns-policy-attachment'
    },
    externalSecrets: {
      iam: 'external-secrets-iam',
      policy: 'external-secrets-policy',
      role: 'external-secrets-role',
      policyAttachment: 'external-secrets-policy-attachment'
    },
    ssmAnnotationResolver: {
      iam: 'ssm-annotation-resolver-iam',
      policy: 'ssm-annotation-resolver-policy',
      role: 'ssm-annotation-resolver-role',
      policyAttachment: 'ssm-annotation-resolver-policy-attachment'
    },
    argoCd: {
      release: 'argocd',
      rootApplication: 'argocd-root-application'
    }
  },
  workload: {
    k8sProvider: 'workload-k8s-provider',
    namespace: 'workload',
    smokeApp: 'smoke-app',
    smokeAppPublicIngress: 'smoke-app-public-ingress'
  }
} as const

type NestedValue<T> = T extends string ? T : { [Key in keyof T]: NestedValue<T[Key]> }[keyof T]
export type ResourceNameSuffix = NestedValue<typeof resourceNameSuffix>
export function resourceName(config: InfrastructureConfig, suffix: ResourceNameSuffix | string): string {
  return normalizeName(`${config.projectName}-${config.environment}-${suffix}`)
}
