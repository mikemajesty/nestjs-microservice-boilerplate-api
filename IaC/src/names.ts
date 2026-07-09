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
    publicLoadBalancerSecurityGroup: 'public-lb-sg',
    publicLoadBalancerHttpIngressRule: 'public-lb-http-ingress',
    publicLoadBalancerTemporaryEgressRule: 'public-lb-temporary-egress'
  },
  dns: {
    internal: 'internal-dns',
    privateHostedZone: 'private-hosted-zone'
  },
  app: {
    containerRegistry: 'app-container-registry',
    containerRepository: 'app',
    containerRepositoryLifecyclePolicy: 'app-ecr-lifecycle-policy'
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
    externalDns: {
      iam: 'external-dns-iam',
      release: 'external-dns',
      policy: 'external-dns-policy',
      role: 'external-dns-role',
      policyAttachment: 'external-dns-policy-attachment'
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
export function resourceName(config: InfrastructureConfig, suffix: ResourceNameSuffix): string {
  return normalizeName(`${config.projectName}-${config.environment}-${suffix}`)
}
