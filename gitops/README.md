# GitOps

This directory contains Kubernetes desired state reconciled by Argo CD.

Pulumi remains responsible for AWS infrastructure and platform bootstrap resources such as VPC, EKS, IAM, OIDC, ECR, DNS base resources, and the initial Argo CD installation.

Argo CD should reconcile Kubernetes applications, cluster add-ons, shared cluster configuration, routes, and other in-cluster manifests from this directory.

Do not commit secrets here. Use an external secret manager or a sealed/encrypted secret workflow for sensitive values.

Layout convention:

```text
gitops/
  apps/                 application-scoped workloads
  addons/               installed products, controllers, and platform add-ons
  cluster/              shared cluster-scoped configuration
  argocd/               Argo CD bootstrap, access, and Application manifests
```

Use `apps` for resources owned by a specific application. Use `addons` for installing products such as controllers or control planes. Use `cluster` for shared platform resources consumed by applications, such as gateways, policies, and shared routing infrastructure.
