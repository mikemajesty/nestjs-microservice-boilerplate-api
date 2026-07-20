include common.mk

FOUNDATION_DIR ?= foundation
K8S_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
FOUNDATION_TARGETS := status stack config check-leftovers cleanup-k8s cleanup-pulumi-k8s-state cleanup-route53-records wait-load-balancers-gone preview up destroy refresh select-account-stack kubeconfig k8s teardown reset reset-app-image-state recreate argo argo-pass

.PHONY: $(FOUNDATION_TARGETS) foundation-shell

ifeq ($(firstword $(MAKECMDGOALS)),k8s)
$(eval $(K8S_ARGS):;@:)
endif

$(FOUNDATION_TARGETS):
	$(MAKE) -C $(FOUNDATION_DIR) $@ K8S_COMMAND="$(K8S_ARGS)"

foundation-shell:
	cd $(FOUNDATION_DIR) && $$SHELL
