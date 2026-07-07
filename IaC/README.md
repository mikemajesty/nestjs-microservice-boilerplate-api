# Getting Started - Pulumi AWS

Esta pasta contem a infraestrutura do boilerplate usando Pulumi com TypeScript.

## Pre-requisitos

- Pulumi CLI instalado.
- AWS CLI instalado.
- Acesso AWS via SSO da empresa.
- Node.js compativel com o projeto.

## 1. Criar o profile AWS local

Crie um profile chamado `IaC-profile` usando o AWS SSO:

```bash
aws configure sso
```

Use os dados da conta/role de infraestrutura de teste e defina o nome do profile como:

```text
IaC-profile
```

Exemplo esperado no arquivo `~/.aws/config`:

```ini
[profile IaC-profile]
sso_session = pick-sso
sso_account_id = <aws-account-id>
sso_role_name = Foundation
region = us-east-1
```

## 2. Fazer login no AWS SSO

Antes de rodar qualquer comando do Pulumi, autentique no profile:

```bash
aws sso login --profile IaC-profile
```

Valide se a AWS CLI esta acessando a conta correta:

```bash
AWS_PROFILE=IaC-profile aws sts get-caller-identity
```

O comando deve retornar `Account`, `Arn` e `UserId`.

## 3. Configurar o Pulumi para usar o profile

Dentro desta pasta, configure o provider AWS do Pulumi para usar o profile `IaC-profile`:

```bash
cd IaC
pulumi config set aws:profile IaC-profile
```

A stack tambem deve ter a regiao configurada:

```bash
pulumi config set aws:region us-east-1
```

Com isso, o Pulumi passa a usar o profile definido no arquivo `~/.aws/config`.

## 4. Validar a infraestrutura

Rode um preview antes de aplicar qualquer mudanca:

```bash
pulumi preview
```

Se o preview estiver correto, aplique:

```bash
pulumi up
```

## 5. Configuracoes e secrets

Use `pulumi config set` para configuracoes nao sensiveis:

```bash
pulumi config set app.environment dev
pulumi config set app.port 5000
```

Use `pulumi config set --secret` para valores sensiveis:

```bash
pulumi config set --secret app.jwtSecret changeme
pulumi config set --secret database.postgresPassword changeme
```

Nao salve credenciais AWS, tokens ou senhas diretamente em arquivos versionados.

## Comandos uteis

```bash
pulumi stack ls
pulumi config
pulumi preview
pulumi up
pulumi destroy
```

## Observacoes

- O profile `IaC-profile` e uma configuracao local da maquina do desenvolvedor.
- Em CI/CD, prefira OIDC assumindo uma IAM Role em vez de profile local.
- Secrets do Pulumi sao para valores da aplicacao/infra, nao para configurar o login AWS SSO.
- Sempre confira a conta AWS com `aws sts get-caller-identity` antes de executar `pulumi up`.
