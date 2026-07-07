AWS_PROFILE ?= IaC-profile
AWS_ACCOUNT_ID ?= $(shell AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text 2>/dev/null)
ACCOUNT_STACK ?= dev
PROJECT ?= nestjs-boilerplate
ENVIRONMENT ?= dev
WORKLOAD_NAMESPACE ?= $(PROJECT)-$(ENVIRONMENT)-workload
SMOKE_INGRESS ?= $(PROJECT)-$(ENVIRONMENT)-smoke-app-public-ingress
AWS_LBC_RELEASE ?= aws-load-balancer-controller
AWS_LBC_NAMESPACE ?= kube-system
K8S_LB_NAME_PREFIX ?= k8s-nestjsbo
ARGOCD_NAMESPACE ?= argocd
ARGOCD_SERVER_SERVICE ?= argo-cd-argocd-server
ARGOCD_LOCAL_PORT ?= 8080
ARGOCD_INITIAL_ADMIN_SECRET ?= argocd-initial-admin-secret

.PHONY: status login identity stack config check-auth check-leftovers preflight cleanup-k8s wait-load-balancers-gone preview up destroy refresh select-account-stack teardown reset recreate argocd argocd-password

status: identity stack config preview

login:
	aws sso login --profile $(AWS_PROFILE)

identity:
	AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity

stack:
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack

config:
	pulumi config

check-auth:
	@test -n "$(AWS_ACCOUNT_ID)" || (echo "AWS auth failed for profile $(AWS_PROFILE). Run: make login"; exit 1)
	@AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws sts get-caller-identity --query Account --output text >/dev/null
	@pulumi whoami >/dev/null

preflight: check-auth
	npm exec tsc -- --noEmit

check-leftovers: check-auth select-account-stack
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

cleanup-k8s: check-auth
	@if command -v kubectl >/dev/null 2>&1; then \
		kubectl delete ingress $(SMOKE_INGRESS) -n $(WORKLOAD_NAMESPACE) --ignore-not-found --wait=true || true; \
		kubectl delete namespace $(WORKLOAD_NAMESPACE) --ignore-not-found --wait=true || true; \
	else \
		echo "kubectl not found; skipping Kubernetes object cleanup"; \
	fi
	@if command -v helm >/dev/null 2>&1; then \
		helm uninstall $(AWS_LBC_RELEASE) -n $(AWS_LBC_NAMESPACE) || true; \
	else \
		echo "helm not found; skipping Helm release cleanup"; \
	fi

wait-load-balancers-gone: check-auth
	@arns=$$(AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `$(K8S_LB_NAME_PREFIX)`)].LoadBalancerArn' --output text); \
	if [ -n "$$arns" ]; then \
		echo "Waiting for Kubernetes load balancers to be deleted: $$arns"; \
		AWS_PAGER= AWS_PROFILE=$(AWS_PROFILE) aws elbv2 wait load-balancers-deleted --load-balancer-arns $$arns || true; \
	fi

up: preflight check-leftovers
	AWS_PROFILE=$(AWS_PROFILE) pulumi up --yes

destroy: check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi destroy

preview: preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi preview

refresh: check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE)  pulumi refresh

# The selected AWS account comes from AWS_PROFILE; keep the Pulumi stack name environment-based.
select-account-stack:
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack select $(ACCOUNT_STACK) || AWS_PROFILE=$(AWS_PROFILE) pulumi stack init $(ACCOUNT_STACK)

# End-of-day cleanup: destroy everything created in the Pulumi stack for the current AWS account.
teardown: check-auth select-account-stack cleanup-k8s wait-load-balancers-gone
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi destroy --yes

# The sandbox account resets every day, so refresh the Pulumi state before recreating resources.
reset: refresh up

recreate: refresh up
	@echo "Recreation finished. Use 'make argocd' and 'make argocd-password' to access Argo CD."

argocd:
	kubectl port-forward svc/$(ARGOCD_SERVER_SERVICE) -n $(ARGOCD_NAMESPACE) $(ARGOCD_LOCAL_PORT):443

argocd-password:
	kubectl get secret $(ARGOCD_INITIAL_ADMIN_SECRET) -n $(ARGOCD_NAMESPACE) -o jsonpath='{.data.password}' | base64 -d; echo
