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

## Smoke app hardening reference

The smoke app already proves the request path through the platform:

```text
Browser or curl -> AWS Load Balancer -> Envoy Gateway -> HTTPRoute -> Service -> Pod
```

The next step is to keep the app simple while making its Kubernetes posture closer to a production baseline. Apply these changes in small commits and validate each one with `kubectl kustomize gitops/apps/smoke-app` before pushing.

### 1. Add a dedicated ServiceAccount and RBAC

Create `gitops/apps/smoke-app/service-account.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nestjs-boilerplate-dev-smoke-app
  namespace: nestjs-boilerplate-dev-workload
  labels:
    app.kubernetes.io/name: nestjs-boilerplate-dev-smoke-app
    app.kubernetes.io/part-of: nestjs-boilerplate
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/environment: dev
automountServiceAccountToken: true
```

For this PoC, the token is mounted intentionally so the workload can call the Kubernetes API and make RBAC behavior visible during learning. For a production workload that does not call the Kubernetes API, prefer `automountServiceAccountToken: false`.

Create `gitops/apps/smoke-app/role.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: nestjs-boilerplate-dev-smoke-app-reader
  namespace: nestjs-boilerplate-dev-workload
  labels:
    app.kubernetes.io/name: nestjs-boilerplate-dev-smoke-app
    app.kubernetes.io/part-of: nestjs-boilerplate
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/environment: dev
rules:
  - apiGroups:
      - ''
    resources:
      - configmaps
      - endpoints
      - pods
      - services
    verbs:
      - get
      - list
      - watch
```

Create `gitops/apps/smoke-app/role-binding.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: nestjs-boilerplate-dev-smoke-app-reader
  namespace: nestjs-boilerplate-dev-workload
  labels:
    app.kubernetes.io/name: nestjs-boilerplate-dev-smoke-app
    app.kubernetes.io/part-of: nestjs-boilerplate
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/environment: dev
subjects:
  - kind: ServiceAccount
    name: nestjs-boilerplate-dev-smoke-app
    namespace: nestjs-boilerplate-dev-workload
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: nestjs-boilerplate-dev-smoke-app-reader
```

Add it to `gitops/apps/smoke-app/kustomization.yaml` before the deployment:

```yaml
resources:
  - namespace.yaml
  - service-account.yaml
  - role.yaml
  - role-binding.yaml
  - deployment.yaml
  - service.yaml
  - http-route.yaml
```

Then set the deployment to use it:

```yaml
spec:
  template:
    spec:
      serviceAccountName: nestjs-boilerplate-dev-smoke-app
      automountServiceAccountToken: true
```

The `Role` defines what can be done in the namespace. The `RoleBinding` grants those permissions to the smoke app `ServiceAccount`.

### 2. Add resource requests and limits

Start conservative for the smoke app and tune with real usage later:

```yaml
resources:
  requests:
    cpu: 50m
    memory: 128Mi
  limits:
    cpu: 250m
    memory: 256Mi
```

This gives the scheduler enough information to place the pod and prevents the sample workload from consuming unbounded node resources.

### 3. Add pod and container security contexts

Set the pod-level context under `spec.template.spec`:

```yaml
securityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault
```

Set the container-level context under the container entry:

```yaml
securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

Only add `readOnlyRootFilesystem: true` after validating that the NestJS runtime and any dependencies do not need to write to the container filesystem. If it fails, keep it out until the image is prepared for a read-only root filesystem.

### 4. Move simple runtime configuration to ConfigMap

For non-sensitive values such as `APP_MAIN`, create `gitops/apps/smoke-app/config-map.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nestjs-boilerplate-dev-smoke-app
  namespace: nestjs-boilerplate-dev-workload
  labels:
    app.kubernetes.io/name: nestjs-boilerplate-dev-smoke-app
    app.kubernetes.io/part-of: nestjs-boilerplate
    app.kubernetes.io/managed-by: argocd
    app.kubernetes.io/environment: dev
data:
  APP_MAIN: main-smoke
```

Reference it from the deployment:

```yaml
envFrom:
  - configMapRef:
      name: nestjs-boilerplate-dev-smoke-app
```

Do not put secrets in this ConfigMap. Use an external secret manager or sealed/encrypted secret workflow for sensitive values.

### 5. Validate before syncing

Render the manifests locally:

```bash
kubectl kustomize gitops/apps/smoke-app
```

If connected to the cluster, run a server-side dry run:

```bash
kubectl apply --server-side --dry-run=server -k gitops/apps/smoke-app
```

After Argo CD syncs, check the rollout and route:

```bash
kubectl rollout status deployment/nestjs-boilerplate-dev-smoke-app -n nestjs-boilerplate-dev-workload
kubectl get pods -n nestjs-boilerplate-dev-workload
kubectl get httproute nestjs-boilerplate-dev-smoke-app -n nestjs-boilerplate-dev-workload
```

Finally, test through the load balancer DNS used by the PoC:

```bash
curl -v http://<load-balancer-dns>/
```

Expected response:

```text
nestjs-boilerplate smoke app
```
