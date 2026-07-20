IAC_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

AWS_PROFILE ?= IaC-profile
AWS_ACCOUNT_ID ?= $(shell AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text 2>/dev/null)
AWS_REGION ?= us-east-1
ACCOUNT_STACK ?= dev
PROJECT ?= nestjs-boilerplate
ENVIRONMENT ?= dev
INTERNAL_DOMAIN_NAME ?= boilerplate.internal
EKS_CLUSTER_NAME ?= $(PROJECT)-$(ENVIRONMENT)-eks-cluster
K8S_CONTEXT ?= $(EKS_CLUSTER_NAME)
WORKLOAD_NAMESPACE ?= $(PROJECT)-$(ENVIRONMENT)-workload
SMOKE_INGRESS ?= $(PROJECT)-$(ENVIRONMENT)-smoke-app-public-ingress
AWS_LBC_RELEASE ?= aws-load-balancer-controller
AWS_LBC_NAMESPACE ?= kube-system
K8S_LB_NAME_PREFIX ?= k8s-nestjsbo
ARGOCD_NAMESPACE ?= argocd
ARGOCD_SERVER_SERVICE ?= argo-cd-argocd-server
ARGOCD_LOCAL_PORT ?= 8080
ARGOCD_INITIAL_ADMIN_SECRET ?= argocd-initial-admin-secret
K8S_CLEANUP_NAMESPACES ?= $(WORKLOAD_NAMESPACE) $(ARGOCD_NAMESPACE) cert-manager envoy-gateway-system external-secrets

export AWS_PROFILE AWS_ACCOUNT_ID AWS_REGION ACCOUNT_STACK PROJECT ENVIRONMENT INTERNAL_DOMAIN_NAME EKS_CLUSTER_NAME
export K8S_CONTEXT WORKLOAD_NAMESPACE SMOKE_INGRESS AWS_LBC_RELEASE AWS_LBC_NAMESPACE K8S_LB_NAME_PREFIX
export ARGOCD_NAMESPACE ARGOCD_SERVER_SERVICE ARGOCD_LOCAL_PORT ARGOCD_INITIAL_ADMIN_SECRET K8S_CLEANUP_NAMESPACES

.PHONY: login identity check-docker check-auth preflight

login: check-docker
	aws sso login --profile $(AWS_PROFILE)

identity: check-docker
	AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity

check-docker:
	@command -v docker >/dev/null 2>&1 || (echo "Docker is not installed or is not available in PATH."; exit 1)
	@docker info >/dev/null 2>&1 || (echo "Docker is not running. Start Docker before running this command."; exit 1)

check-auth: check-docker
	@test -n "$(AWS_ACCOUNT_ID)" || (echo "AWS auth failed for profile $(AWS_PROFILE). Run: make login"; exit 1)
	@AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text >/dev/null
	@pulumi whoami >/dev/null

preflight: check-auth
	cd $(IAC_ROOT) && npm exec tsc -- --noEmit