include ../common.mk

.PHONY: status stack config preview up destroy refresh recreate select-account-stack

status: check-docker identity stack config preview

stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack

config: check-docker
	pulumi config

preview: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi preview

up: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi up --yes

refresh: check-docker check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi refresh --yes

recreate: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi refresh --yes
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi preview
	AWS_PROFILE=$(AWS_PROFILE) PULUMI_K8S_DELETE_UNREACHABLE=true pulumi up --yes

init:
	pulumi stack init dev

# The selected AWS account comes from AWS_PROFILE; keep the Pulumi stack name environment-based.
select-account-stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack select $(ACCOUNT_STACK) || AWS_PROFILE=$(AWS_PROFILE) pulumi stack init $(ACCOUNT_STACK)