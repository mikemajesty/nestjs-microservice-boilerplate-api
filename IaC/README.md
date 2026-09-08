# Infrastructure as Code

This directory contains the AWS infrastructure for the boilerplate project. It
uses Pulumi with TypeScript and is split into two Pulumi programs:

- `foundation`: networking, EKS, Karpenter, databases, cache, IAM, secrets,
  observability dependencies, and the container registry.
- `edge`: external-facing resources that depend on the foundation outputs,
  such as DNS, CloudFront, and VPC origins.

The infrastructure is intended to be deployed to AWS in `us-east-1` using the
`dev` Pulumi stack by default.

## Prerequisites

Install and configure the following tools:

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [Pulumi CLI](https://www.pulumi.com/docs/install/)
- Node.js and npm compatible with the repository
- Docker Desktop (the Makefiles validate that Docker is running)
- `kubectl`, Helm, and `jq` for Kubernetes access and cleanup operations

You also need:

- Access to the AWS account and SSO role used by the project
- Permission to create and manage the AWS and Kubernetes resources in this
  stack
- A Pulumi account or backend configured with `pulumi login`

## AWS profile and SSO

The default profile used by the Makefiles is `IaC-profile`. Create it with
AWS SSO:

```bash
aws configure sso
```

Use the infrastructure account and role, and set the profile name to:

```text
IaC-profile
```

Example `~/.aws/config` entry:

```ini
[profile IaC-profile]
sso_session = pick-sso
sso_account_id = <aws-account-id>
sso_role_name = Foundation
region = us-east-1
```

Authenticate before running Pulumi:

```bash
aws sso login --profile IaC-profile
AWS_PROFILE=IaC-profile aws sts get-caller-identity
```

Always verify the returned account before running `pulumi up`, `destroy`, or
any command that changes AWS resources.

## Pulumi configuration

The foundation stack configuration is stored in
[`foundation/Pulumi.dev.yaml`](./foundation/Pulumi.dev.yaml). It contains the
region, AWS profile, environment, network settings, and non-secret resource
configuration.

Select the stack and configure the AWS provider from the directory of the
Pulumi program you want to manage:

```bash
cd IaC/foundation
pulumi login
pulumi stack select dev
pulumi config set aws:profile IaC-profile
pulumi config set aws:region us-east-1
```

Repeat the configuration in `IaC/edge` when managing the edge program. If the
selected stack does not exist for the current Pulumi program, initialize it:

```bash
pulumi stack init dev
```

Do not commit credentials, tokens, passwords, or other sensitive values.
Store sensitive Pulumi configuration with `--secret`:

```bash
pulumi config set --secret <namespace>:<key> <value>
```

AWS SSO credentials are managed by the AWS CLI, not by Pulumi secrets.

## Deploying the foundation

Run these commands from `IaC/foundation`:

```bash
cd IaC/foundation
AWS_PROFILE=IaC-profile make preview
AWS_PROFILE=IaC-profile make up
```

The Makefile runs TypeScript validation, checks AWS/Pulumi authentication,
selects the `dev` stack, and then runs the Pulumi operation. `make up` also
checks for AWS resources left behind when the Pulumi state is empty.

Useful foundation commands:

```bash
make status       # identity, stack/config information, and preview
make preview      # preview changes
make up           # apply changes
make refresh      # refresh Pulumi state from AWS
make kubeconfig   # configure kubectl for the EKS cluster
make k8s K8S_COMMAND="get nodes"
make destroy      # destroy the foundation stack
make teardown     # clean Kubernetes resources and destroy the stack
```

`destroy` and `teardown` are destructive operations. Review the preview and
confirm the selected AWS account before running them.

## Deploying the edge stack

After the foundation is available, run these commands from `IaC/edge`:

```bash
cd IaC/edge
AWS_PROFILE=IaC-profile make preview
AWS_PROFILE=IaC-profile make up
```

Useful edge commands:

```bash
make status
make preview
make up
make refresh
make recreate
```

## Kubernetes and GitOps

The foundation provisions the EKS platform and its supporting AWS resources.
Application workloads and observability components are deployed from the
repository's [`gitops/`](../gitops/) directory through Argo CD.

After the cluster is available, configure access and inspect it with:

```bash
cd IaC/foundation
AWS_PROFILE=IaC-profile make kubeconfig
AWS_PROFILE=IaC-profile make k8s K8S_COMMAND="get nodes"
AWS_PROFILE=IaC-profile make k8s K8S_COMMAND="get applications -n argocd"
```

The `make argo` target opens a local port-forward to Argo CD, and
`make argo-pass` retrieves the initial admin password:

```bash
AWS_PROFILE=IaC-profile make argo
AWS_PROFILE=IaC-profile make argo-pass
```

## CI/CD guidance

For CI/CD, do not use a developer SSO profile. Prefer GitHub Actions OIDC
with a dedicated, least-privilege IAM role and short-lived credentials.

## Troubleshooting

- Run `make login` if AWS authentication has expired.
- Run `make identity` to verify the active AWS account.
- Run `make refresh` when Pulumi state differs from AWS.
- Use `pulumi preview --diff` to inspect property-level changes.
- If Kubernetes resources cannot be reached during destroy, use the cleanup
  targets in `foundation/Makefile` before destroying the Pulumi stack.
- If a command fails because a dependency is missing, install the prerequisite
  listed above and rerun the same target.
