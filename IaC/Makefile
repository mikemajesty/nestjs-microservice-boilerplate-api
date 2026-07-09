AWS_PROFILE ?= IaC-profile
AWS_ACCOUNT_ID ?= $(shell AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text 2>/dev/null)
AWS_REGION ?= us-east-1
ACCOUNT_STACK ?= dev
PROJECT ?= nestjs-boilerplate
ENVIRONMENT ?= dev
EKS_CLUSTER_NAME ?= $(PROJECT)-$(ENVIRONMENT)-eks-cluster
K8S_CONTEXT ?= $(EKS_CLUSTER_NAME)
K8S_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
K8S_COMMAND ?= $(K8S_ARGS)
WORKLOAD_NAMESPACE ?= $(PROJECT)-$(ENVIRONMENT)-workload
SMOKE_INGRESS ?= $(PROJECT)-$(ENVIRONMENT)-smoke-app-public-ingress
AWS_LBC_RELEASE ?= aws-load-balancer-controller
AWS_LBC_NAMESPACE ?= kube-system
K8S_LB_NAME_PREFIX ?= k8s-nestjsbo
ARGOCD_NAMESPACE ?= argocd
ARGOCD_SERVER_SERVICE ?= argo-cd-argocd-server
ARGOCD_LOCAL_PORT ?= 8080
ARGOCD_INITIAL_ADMIN_SECRET ?= argocd-initial-admin-secret

.PHONY: status login identity stack config check-docker check-auth check-leftovers preflight cleanup-k8s wait-load-balancers-gone preview up destroy refresh select-account-stack kubeconfig k8s teardown reset reset-app-image-state recreate argocd argocd-password

ifeq ($(firstword $(MAKECMDGOALS)),k8s)
$(eval $(K8S_ARGS):;@:)
endif

status: check-docker identity stack config preview

login: check-docker
	aws sso login --profile $(AWS_PROFILE)

identity: check-docker
	AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity

stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack

config: check-docker
	pulumi config

check-docker:
	@command -v docker >/dev/null 2>&1 || (echo "Docker is not installed or is not available in PATH."; exit 1)
	@docker info >/dev/null 2>&1 || (echo "Docker is not running. Start Docker before running this command."; exit 1)

check-auth: check-docker
	@test -n "$(AWS_ACCOUNT_ID)" || (echo "AWS auth failed for profile $(AWS_PROFILE). Run: make login"; exit 1)
	@AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text >/dev/null
	@pulumi whoami >/dev/null

preflight: check-auth
	npm exec tsc -- --noEmit

check-leftovers: check-docker check-auth select-account-stack
	@stack_resources=$$(pulumi stack --show-urns | sed -n 's/^Current stack resources (\([0-9][0-9]*\)):.*/\1/p'); \
	vpcs=$$(AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws ec2 describe-vpcs --filters Name=tag:Project,Values=$(PROJECT) Name=tag:Environment,Values=$(ENVIRONMENT) --query 'Vpcs[].VpcId' --output text); \
	eips=$$(AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws ec2 describe-addresses --filters Name=tag:Project,Values=$(PROJECT) Name=tag:Environment,Values=$(ENVIRONMENT) --query 'Addresses[].AllocationId' --output text); \
	if [ "$$stack_resources" = "0" ] && { [ -n "$$vpcs" ] || [ -n "$$eips" ]; }; then \
		echo "AWS leftovers found for Project=$(PROJECT) Environment=$(ENVIRONMENT), but Pulumi state is empty."; \
		[ -z "$$vpcs" ] || echo "VPCs: $$vpcs"; \
		[ -z "$$eips" ] || echo "EIPs: $$eips"; \
		echo "Clean these leftovers before running make up, or set PROJECT/ENVIRONMENT intentionally."; \
		exit 1; \
	fi

cleanup-k8s: check-docker check-auth kubeconfig
	@if command -v kubectl >/dev/null 2>&1; then \
		AWS_PROFILE=$(AWS_PROFILE) kubectl --context $(K8S_CONTEXT) delete ingress $(SMOKE_INGRESS) -n $(WORKLOAD_NAMESPACE) --ignore-not-found --wait=true || true; \
		AWS_PROFILE=$(AWS_PROFILE) kubectl --context $(K8S_CONTEXT) delete namespace $(WORKLOAD_NAMESPACE) --ignore-not-found --wait=true || true; \
	else \
		echo "kubectl not found; skipping Kubernetes object cleanup"; \
	fi
	@if command -v helm >/dev/null 2>&1; then \
		helm uninstall $(AWS_LBC_RELEASE) -n $(AWS_LBC_NAMESPACE) || true; \
	else \
		echo "helm not found; skipping Helm release cleanup"; \
	fi

wait-load-balancers-gone: check-docker check-auth
	@arns=$$(AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `$(K8S_LB_NAME_PREFIX)`)].LoadBalancerArn' --output text); \
	if [ -n "$$arns" ]; then \
		echo "Waiting for Kubernetes load balancers to be deleted: $$arns"; \
		AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws elbv2 wait load-balancers-deleted --load-balancer-arns $$arns || true; \
	fi

up: check-docker preflight check-leftovers
	AWS_PROFILE=$(AWS_PROFILE) pulumi up --yes

destroy: check-docker check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi destroy

preview: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi preview

refresh: check-docker check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE)  pulumi refresh

# The selected AWS account comes from AWS_PROFILE; keep the Pulumi stack name environment-based.
select-account-stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack select $(ACCOUNT_STACK) || AWS_PROFILE=$(AWS_PROFILE) pulumi stack init $(ACCOUNT_STACK)

kubeconfig: check-docker check-auth
	AWS_PROFILE=$(AWS_PROFILE) aws eks update-kubeconfig --region $(AWS_REGION) --name $(EKS_CLUSTER_NAME) --alias $(K8S_CONTEXT)

k8s: check-docker kubeconfig
	@test -n "$(K8S_COMMAND)" || (echo "Usage: make k8s K8S_COMMAND=\"<kubectl args>\""; exit 1)
	AWS_PROFILE=$(AWS_PROFILE) kubectl --context $(K8S_CONTEXT) $(K8S_COMMAND)

# End-of-day cleanup: destroy everything created in the Pulumi stack for the current AWS account.
teardown: check-docker check-auth select-account-stack cleanup-k8s wait-load-balancers-gone
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi destroy --yes

# The sandbox account resets every day, so the previous EKS endpoint can be gone during refresh.
reset: refresh up

reset-app-image-state: check-docker select-account-stack
	@image_urns=$$(pulumi stack export | jq -r '.deployment.resources[] | select(.type == "docker:index/image:Image") | .urn'); \
	if [ -z "$$image_urns" ]; then \
		echo "No docker.Image resources found in Pulumi state."; \
	else \
		echo "$$image_urns" | while IFS= read -r image_urn; do \
			[ -z "$$image_urn" ] || pulumi state delete "$$image_urn" --yes; \
		done; \
	fi

recreate: check-docker preflight select-account-stack reset-app-image-state
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi refresh --yes
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi preview
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi up --yes
	@echo "Recreation finished. Use 'make argocd' and 'make argocd-password' to access Argo CD."

argocd: check-docker kubeconfig
	AWS_PROFILE=$(AWS_PROFILE) kubectl --context $(K8S_CONTEXT) port-forward svc/$(ARGOCD_SERVER_SERVICE) -n $(ARGOCD_NAMESPACE) $(ARGOCD_LOCAL_PORT):443

argocd-password: check-docker kubeconfig
	AWS_PROFILE=$(AWS_PROFILE) kubectl --context $(K8S_CONTEXT) get secret $(ARGOCD_INITIAL_ADMIN_SECRET) -n $(ARGOCD_NAMESPACE) -o jsonpath='{.data.password}' | base64 -d; echo
