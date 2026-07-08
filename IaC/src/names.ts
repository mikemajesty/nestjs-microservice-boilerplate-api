import type { InfrastructureConfig } from './config'

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export enum ResourceNameSuffix {
  VPC = 'vpc',
  VPC_NETWORK = 'vpc-network',
  NETWORK_SECURITY_GROUPS = 'network-security-groups',
  PUBLIC_LOAD_BALANCER_SECURITY_GROUP = 'public-lb-sg',
  PUBLIC_LOAD_BALANCER_HTTP_INGRESS_RULE = 'public-lb-http-ingress',
  PUBLIC_LOAD_BALANCER_TEMPORARY_EGRESS_RULE = 'public-lb-temporary-egress',
  INTERNAL_DNS = 'internal-dns',
  PRIVATE_HOSTED_ZONE = 'private-hosted-zone',
  APPLICATION_CONTAINER_REGISTRY = 'app-container-registry',
  APPLICATION_CONTAINER_REPOSITORY = 'app',
  APPLICATION_CONTAINER_REPOSITORY_LIFECYCLE_POLICY = 'app-ecr-lifecycle-policy',
  EKS_CLUSTER = 'eks-cluster',
  EKS_CLUSTER_IAM = 'eks-cluster-iam',
  EKS_CLUSTER_OIDC_PROVIDER = 'eks-cluster-oidc-provider',
  EKS_CLUSTER_ROLE = 'eks-cluster-role',
  EKS_CLUSTER_ROLE_POLICY_ATTACHMENT = 'eks-cluster-role-policy-attachment',
  AWS_LOAD_BALANCER_CONTROLLER_IAM = 'aws-load-balancer-controller-iam',
  AWS_LOAD_BALANCER_CONTROLLER = 'aws-load-balancer-controller',
  AWS_LOAD_BALANCER_CONTROLLER_POLICY = 'aws-load-balancer-controller-policy',
  AWS_LOAD_BALANCER_CONTROLLER_ROLE = 'aws-load-balancer-controller-role',
  AWS_LOAD_BALANCER_CONTROLLER_POLICY_ATTACHMENT = 'aws-load-balancer-controller-policy-attachment',
  EXTERNAL_DNS = 'external-dns',
  EXTERNAL_DNS_IAM = 'external-dns-iam',
  EXTERNAL_DNS_POLICY = 'external-dns-policy',
  EXTERNAL_DNS_ROLE = 'external-dns-role',
  EXTERNAL_DNS_POLICY_ATTACHMENT = 'external-dns-policy-attachment',
  ARGOCD = 'argocd',
  ARGOCD_ROOT_APPLICATION = 'argocd-root-application',
  EKS_NODE_IAM = 'eks-node-iam',
  EKS_NODE_ROLE = 'eks-node-role',
  EKS_NODE_WORKER_POLICY_ATTACHMENT = 'eks-node-worker-policy-attachment',
  EKS_NODE_CNI_POLICY_ATTACHMENT = 'eks-node-cni-policy-attachment',
  EKS_NODE_ECR_POLICY_ATTACHMENT = 'eks-node-ecr-policy-attachment',
  EKS_NODE_SSM_MANAGED_INSTANCE_POLICY_ATTACHMENT = 'eks-node-ssm-managed-instance-policy-attachment',
  EKS_NODE_SSM_PATCH_POLICY_ATTACHMENT = 'eks-node-ssm-patch-policy-attachment',
  EKS_NODE_GROUP = 'eks-node-group',
  WORKLOAD_K8S_PROVIDER = 'workload-k8s-provider',
  WORKLOAD_NAMESPACE = 'workload',
  WORKLOAD_SMOKE_APP = 'smoke-app',
  WORKLOAD_SMOKE_APP_PUBLIC_INGRESS = 'smoke-app-public-ingress'
}
export function resourceName(config: InfrastructureConfig, suffix: ResourceNameSuffix): string {
  return normalizeName(`${config.projectName}-${config.environment}-${suffix}`)
}
