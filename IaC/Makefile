include common.mk

FOUNDATION_DIR ?= foundation
EDGE_DIR ?= edge
K8S_ARGS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
FOUNDATION_TARGETS := status stack config check-leftovers cleanup-k8s cleanup-pulumi-k8s-state cleanup-route53-records wait-load-balancers-gone preview up destroy refresh select-account-stack kubeconfig k8s teardown reset reset-app-image-state recreate argo argo-pass
EDGE_TARGETS := edge-status edge-stack edge-config edge-preview edge-up edge-destroy edge-refresh

.PHONY: $(FOUNDATION_TARGETS) $(EDGE_TARGETS) foundation-shell edge-shell

ifeq ($(firstword $(MAKECMDGOALS)),k8s)
$(eval $(K8S_ARGS):;@:)
endif

$(FOUNDATION_TARGETS):
	$(MAKE) -C $(FOUNDATION_DIR) $@ K8S_COMMAND="$(K8S_ARGS)"

edge-status edge-stack edge-config edge-preview edge-up edge-destroy edge-refresh:
	$(MAKE) -C $(EDGE_DIR) $(patsubst edge-%,%,$@)

foundation-shell:
	cd $(FOUNDATION_DIR) && $$SHELL

edge-shell:
	cd $(EDGE_DIR) && $$SHELL
