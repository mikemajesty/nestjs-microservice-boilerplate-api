# GitOps

This directory contains Kubernetes desired state reconciled by Argo CD.

Pulumi remains responsible for AWS infrastructure and platform bootstrap resources such as VPC, EKS, IAM, OIDC, ECR, DNS base resources, and the initial Argo CD installation.

Argo CD should reconcile Kubernetes applications, cluster add-ons, routes, and other in-cluster manifests from this directory.

Do not commit secrets here. Use an external secret manager or a sealed/encrypted secret workflow for sensitive values.

Initial layout:

```text
gitops/
  apps/                 application workloads
  addons/               Kubernetes platform add-ons
  argocd/applications/  Argo CD Application manifests
```
