include ../common.mk

.PHONY: status stack config preview up destroy refresh select-account-stack

status: check-docker identity stack config preview

stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack

config: check-docker
	pulumi config

preview: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi preview

up: check-docker preflight select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi up --yes

destroy: check-docker check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi destroy

refresh: check-docker check-auth select-account-stack
	AWS_PROFILE=$(AWS_PROFILE) pulumi refresh --yes

# The selected AWS account comes from AWS_PROFILE; keep the Pulumi stack name environment-based.
select-account-stack: check-docker
	AWS_PROFILE=$(AWS_PROFILE) pulumi stack select $(ACCOUNT_STACK) || AWS_PROFILE=$(AWS_PROFILE) pulumi stack init $(ACCOUNT_STACK)