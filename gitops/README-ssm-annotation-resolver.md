# SSM Annotation Resolver

## Problema

O Pulumi cria recursos AWS (SGs, VPC IDs, ARNs) e os exporta como outputs de stack.
O GitOps (Argo CD + Kustomize) vive em um repositório Git e renderiza manifests **antes** de aplicá-los no cluster.

O problema surge quando um manifest Kubernetes precisa de um valor que só existe depois que o Pulumi roda.

Exemplo concreto neste projeto:

```yaml
# gitops/cluster/private-origin-gateway/private-origin-envoy-proxy.yaml
envoyService:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-security-groups: <SG ID do NLB>
```

O `SG ID` é criado pelo Pulumi. Hardcodar no YAML é ruim porque:
- o valor muda quando a infra é destruída e recriada
- exige atualização manual no Git a cada mudança de infra
- quebra GitOps como fonte única de verdade

Soluções avaliadas e descartadas para este projeto:

```text
Kustomize replacements + ExternalSecret -> nao funciona: kustomize roda antes do ESO criar o Secret
SSM Parameter Store direto no render -> nao funciona: kustomize nao faz lookup externo
Jsonnet / ytt / CUE -> resolve o template, mas nao resolve o transporte do valor
Helm values -> viavel, mas exigiria converter toda a stack para Helm
```

---

## Solucao: SSM Annotation Resolver

Um **Mutating Admission Webhook + Controller** que:

1. Intercepta qualquer recurso Kubernetes com annotation no formato `#:ssm:/path/to/parameter`
2. Busca o valor real no AWS SSM Parameter Store
3. Substitui o placeholder pelo valor resolvido antes de o recurso ser persistido no etcd
4. Reconcilia continuamente: se o valor no SSM mudar, o controller detecta e atualiza o recurso no cluster

### Convenção de placeholder

```yaml
annotations:
  alguma-annotation-qualquer: "#:ssm:/caminho/no/ssm"
```

Exemplos reais:

```yaml
service.beta.kubernetes.io/aws-load-balancer-security-groups: "#:ssm:/nestjs-boilerplate/dev/infra/envoy-nlb-sg-id"
service.beta.kubernetes.io/aws-load-balancer-subnets: "#:ssm:/nestjs-boilerplate/dev/network/private-subnet-ids"
```

O prefixo `#:ssm:` é o gatilho. Qualquer annotation com esse prefixo em qualquer recurso é candidata à resolucao.

---

## Arquitetura

```text
Argo CD aplica EnvoyProxy com annotation "#:ssm:/path"
              |
              v
kube-apiserver recebe o recurso
              |
              v
chama o webhook (HTTPS POST - AdmissionReview)
              |
              v
ssm-annotation-resolver/webhook
  - varre annotations buscando "#:ssm:"
  - para cada match: consulta SSM API
  - monta JSON Patch substituindo os valores
  - retorna AdmissionReview com patch
              |
              v
kube-apiserver persiste recurso com valores reais
              |
              v
cluster nunca ve o placeholder
```

O controller reconcilia em paralelo:

```text
controller loop (a cada N minutos)
  - lista todos os recursos com annotations "#:ssm:" resolvidas
  - compara valor atual com SSM
  - se mudou: forca update no recurso para re-disparar o webhook
```

---

## Decisoes de design

| Decisao | Escolha | Razao |
|---|---|---|
| failurePolicy | `Ignore` | evita bloquear o cluster se o resolver estiver fora do ar; o recurso sobe com o placeholder e o controller corrige depois |
| resources interceptados | todos (`*`) | maxima reusabilidade; qualquer annotation em qualquer recurso pode usar o padrao |
| cache SSM | sem cache | evita inconsistencias e simplifica o comportamento; valor sempre vem direto da fonte |
| reconciliacao | controller com requeue | garante que mudancas no SSM se propagam para o cluster sem intervenção manual |
| autenticacao AWS | IRSA | padrao do projeto; sem credenciais estaticas |
| TLS do webhook | cert-manager | ja existe no cluster |

---

## Componentes a criar

### IaC (foundation)

```text
addon-ssm-annotation-resolver-iam.ts
  - IAM role bootstrap com IRSA para o ServiceAccount do resolver
  - policy:
      ssm:GetParameter, ssm:GetParameters   <- resolver busca valores
      sqs:CreateQueue                       <- CRD provisiona fila/DLQ
      sqs:ReceiveMessage, sqs:DeleteMessage  <- controller consome eventos do EventBridge
      sqs:GetQueueAttributes                 <- healthcheck da fila
  - escopo ssm: apenas parametros com prefixo /<projectName>/<environment>/
  - escopo sqs: apenas filas do proprio resolver

network-ssm-change-events.ts (ou dentro do network-nlb-parameter-store.ts)
  - SQS queue: recebe eventos do EventBridge quando parametros SSM mudam
  - EventBridge rule: source=aws.ssm, detail-type=Parameter Store Change
      filtrado por parametros com prefixo /<projectName>/<environment>/
  - EventBridge target: a SQS queue acima
  - SQS queue policy: permite EventBridge publicar na fila
```

### GitOps (addons)

```text
gitops/addons/ssm-annotation-resolver-crd/
  ssminfra-crd.yaml
  kustomization.yaml
```

Hoje o repositório versiona e aplica o **CRD** via GitOps, e o mesmo manifesto
também e aplicado pelo Foundation antes de criar a instancia
`SsmAnnotationResolverInfra`, evitando corrida no primeiro `pulumi up`.

> O Application/Helm release do controller continua pendente do primeiro artefato
> publicado (image/chart versionados). Sem isso, o Argo CD nao consegue apontar
> para um tag real com seguranca.

### Argocd Application

```text
gitops/argocd/applications/ssm-annotation-resolver-crd.yaml
  sync-wave: '15'
gitops/argocd/applications/ssm-annotation-resolver.yaml
  sync-wave: '18'
```

### O servidor (implementacao)

Linguagem sugerida: **Go** ou **TypeScript/Node**.

Endpoints:

```text
POST /mutate    <- webhook handler
GET  /healthz   <- liveness/readiness probe
```

Logica do `/mutate`:

```text
1. decode AdmissionReview
2. para cada annotation do recurso:
   a. se value comeca com "#:ssm:"
   b. extrai o path (tudo depois de "#:ssm:")
   c. chama ssm:GetParameter para resolver o valor atual
   e. adiciona JSON Patch: op=replace, path=/metadata/annotations/<key>, value=<resolved>
3. retorna AdmissionReview com patch e uid correto
4. se SSM retornar erro: loga warning, nao adiciona patch (failurePolicy: Ignore cuida do resto)
```

Quando o SSM e chamado:

```text
DEPLOY (webhook - fluxo principal):
  Argo CD aplica recurso -> webhook intercepta -> SSM.GetParameter (1 call) -> patch -> persiste
  O webhook so roda quando o recurso e criado ou atualizado no cluster.
  Para o EnvoyProxy isso acontece raramente (uma vez por infra criada).

MUDANCA DE VALOR NO SSM (quando pulumi up recria o SG):
  O webhook nao reage a mudancas no SSM sozinho.
  Opcao 1 (PoC): apos "pulumi up", forca re-apply manual:
    kubectl rollout restart deployment/<envoy-deployment> -n envoy-gateway-system
    -> webhook intercepta o novo pod spec -> resolve novo SG ID do SSM
  Opcao 2 (producao - sera implementada): EventBridge + SQS + controller:
    pulumi up
      -> SSM.PutParameter
        -> EventBridge rule (aws.ssm.ParameterStore.ParameterCreated/Updated)
          -> SQS queue (EventBridge entrega mensagem na fila)
            -> controller faz long polling na fila (sqs:ReceiveMessage, WaitTimeSeconds=20)
              -> ao receber mensagem: extrai o parameter path do evento
                -> lista recursos com annotation "#:ssm:<esse path>"
                  -> forca patch no recurso -> webhook reinterceta e resolve novo valor
                    -> controller deleta mensagem da fila (sqs:DeleteMessage)
```

Por que SQS no meio (nao EventBridge direto para o controller):
  - o controller roda dentro do cluster (pod) e nao tem endpoint publico
  - EventBridge nao consegue fazer push para dentro de um cluster privado
  - SQS e um buffer: o controller faz long polling de dentro do cluster sem precisar de ingress
  - long polling com WaitTimeSeconds=20: ~130k requests/mes = ~$0.05/mes

Nao usar polling periodico ao SSM — o valor muda so quando a infra e destruida e recriada,
que e um evento raro e previsivel (sempre disparado pelo pulumi up).

Logica do controller (dois comportamentos):

```text
AO INICIAR (recovery de failurePolicy: Ignore):
  1. lista todos os recursos do cluster com annotations "#:ssm:" ainda nao resolvidas
     (valor ainda comeca com "#:ssm:" — webhook nao rodou ou falhou no apply)
  2. para cada um: forca patch no metadata para re-disparar o webhook

LOOP CONTINUO (reacao a mudancas no SSM via EventBridge → SQS):
  1. long polling na SQS queue (WaitTimeSeconds=20, MaxNumberOfMessages=10)
  2. para cada mensagem recebida:
     a. extrai o SSM parameter path do evento
     b. lista recursos no cluster com annotation apontando para esse path
     c. forca patch em cada um -> webhook reinterceta -> SSM.GetParameter com valor novo
     d. deleta mensagem da fila
```

---

## Sync-wave e ordem de dependencias

```text
wave 10  -> cert-manager (instala CRDs e controller)
wave 15  -> ssm-annotation-resolver-crd
wave 15  -> external-secrets-store (ClusterSecretStore)
wave 17  -> cluster-certificates (cria o ClusterIssuer usado pelo webhook)
wave 18  -> ssm-annotation-resolver (controller/webhook via chart OCI)
wave 20  -> private-origin-gateway (EnvoyProxy com "#:ssm:" sera interceptado pelo resolver)
wave 30  -> smoke-app
```

Agora o controller/webhook esta apontando para o chart OCI publicado em
`ghcr.io/mikemajesty/charts` com `targetRevision: 0.0.1`.

---

## O que o YAML vai parecer depois

Antes (hoje, hardcoded ou sem valor):

```yaml
envoyService:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-security-groups: sg-0129ff3b4f7d77bd8
```

Depois (com o resolver):

```yaml
envoyService:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-security-groups: "#:ssm:/nestjs-boilerplate/dev/infra/envoy-nlb-sg-id"
```

O Git fica com o placeholder. O cluster sempre ve o valor real.

---

## Limitacoes conhecidas

```text
- com failurePolicy: Ignore, se o resolver estiver fora do ar na criacao do recurso,
  o recurso sobe com o placeholder e o AWS Load Balancer Controller vai falhar ao usar "#:ssm:..." como SG ID
  -> o controller de reconciliacao corrige isso em ate N minutos

- o controller precisa de permissao broad (list/patch em todos os recursos)
  -> mitigar com namespace selector no webhook e RBAC restrito por namespace

- latencia adicional no apply de qualquer recurso (webhook call sincrono)
  -> mitigado pelo baixo volume esperado de creates/updates desses recursos

- bootstrap problem: o resolver precisa estar rodando antes dos recursos com "#:ssm:"
  -> garantido pelo sync-wave 12 antes do wave 20 do private-origin-gateway
```

---

## Referencia de implementacao

Quando implementar, seguir este repo como referencia de estrutura de webhook Kubernetes em Go:

```text
https://github.com/kubernetes/sample-controller
https://book.kubebuilder.io/reference/webhook-overview
```

O servidor de webhook pode ser minimo: nao precisa de kubebuilder completo.
Um servidor HTTP simples com o handler de AdmissionReview ja e suficiente para comecar.
