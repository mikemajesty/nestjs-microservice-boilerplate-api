# Evolucoes planejadas da infraestrutura

Este documento registra evolucoes que ainda devem acontecer na PoC ou em uma versao mais madura da infraestrutura.

A diferenca para `README-poc-decisoes.md` e:

```text
README-poc-decisoes.md -> explica por que fizemos algo de um jeito agora.
README-evolucoes.md -> lista o que ainda vamos evoluir depois.
```

Este arquivo deve ser atualizado a cada nova etapa.

## Legenda

```text
PoC depois -> ainda queremos fazer nesta PoC, mas nao agora.
Projeto maior -> importante para producao ou arquitetura corporativa, mas fora do escopo imediato.
```

## Rede base

Estado atual:

```text
VPC com 2 AZs
subnets publicas e privadas
Internet Gateway
1 NAT Gateway
subnet tags para Kubernetes Load Balancers
```

Evolucoes PoC depois:

```text
validar no Console as subnets e route tables criadas pelo awsx
estudar quais rotas foram criadas para public/private subnets
avaliar VPC endpoints antes de deixar EKS mais privado
```

Evolucoes projeto maior:

```text
3 AZs
NAT Gateway por AZ
planejamento formal de CIDR
VPC endpoints para servicos AWS criticos
NACLs por camada se houver requisito
Transit Gateway ou VPC peering para multiplas VPCs
conta central de networking
```

## Security Groups

Estado atual:

```text
security group dedicado do NLB interno do Envoy criado pela foundation
ingress do NLB restrito ao prefix list gerenciado do CloudFront origin-facing nas portas 80 e 443
health checks internos da VPC permitidos na porta 80
contrato foundation -> GitOps para SG do NLB no EnvoyProxy validado via CRD de SSM, sem hardcode no Git
egress ainda aberto para simplificar a PoC
```

Evolucoes PoC depois:

```text
restringir egress do Load Balancer quando o fluxo final entre NLB, Envoy e app estiver estabilizado
criar SG da app quando existir workload real
criar SG dos VPC endpoints quando endpoints forem criados
criar SG do RDS e Redis quando esses recursos existirem
```

Evolucoes projeto maior:

```text
regras de SG com menor privilegio quando houver mais superficies expostas
NetworkPolicy dentro do Kubernetes
Security Groups for Pods se fizer sentido
```

## Borda publica / CDN

Estado atual:

```text
IaC reorganizado em projetos Pulumi separados: foundation e edge
foundation/dev aplicado e criando a base AWS/Kubernetes da PoC
edge/dev criado como stack separado lendo outputs de foundation/dev via StackReference
NLB internal do Envoy Gateway criado como origem privada
CloudFront Distribution criada no projeto edge
AWS WAF criado e associado ao CloudFront
CloudFront VPC Origin modelado apontando para o NLB privado do Envoy
cache policies e origin request policies iniciais definidas no edge
smoke app roteando por HTTPRoute pelo private-origin-gateway
NLB internal do Envoy ativo, com target groups healthy
Service da app e Service do Envoy validados de dentro do cluster
curl local/VPN para o DNS do NLB internal ainda nao e o objetivo principal; o foco e o caminho CloudFront -> VPC Origin -> Envoy
```

Premissa:

```text
a aplicacao pode ter dois caminhos de acesso ao mesmo tempo
publico: usuarios externos acessam por dominio publico e borda protegida
privado: workloads internos, VPN, bastion ou rede corporativa acessam por DNS privado
esses caminhos devem ser pensados separadamente, mesmo quando chegam na mesma aplicacao
```

Passos atuais:

```text
manter contrato estavel para o NLB privado do Envoy Gateway via nome/tag e outputs da foundation
ajustar o CloudFront para usar comportamento compativel com API dinamica e autenticada
validar fim a fim o caminho CloudFront -> VPC Origin -> NLB privado -> Envoy Gateway -> app
manter e versionar o contrato do SG do NLB no EnvoyProxy via CRD de SSM
```

Passo em que estamos agora:

```text
foundation/dev esta aplicado e saudavel
edge/dev esta criado como stack separado e consegue ler outputs da foundation
CloudFront, WAF e VPC Origin ja foram modelados no edge
private-origin-gateway reconciliando com o contrato do SG do NLB resolvido
CRD de SSM validado para injetar o SG no EnvoyProxy sem hardcode no Git
fluxo publico validado com CloudFront, VPC Origin, NLB privado, Envoy Gateway e app
fluxo de render/sync do Argo CD sem bloqueio desse valor
```

Evolucoes PoC depois:

```text
definir dominio publico para apontar para o CloudFront quando sair do dominio default
```

Evolucoes projeto maior:

```text
politicas padronizadas de cache, origin request e response headers
WAF com managed rules, rate limit e excecoes
separacao formal entre dominio publico e dominios internos
logs centralizados de CloudFront, WAF e Gateway
```

## DNS interno

Estado atual:

```text
Route 53 Private Hosted Zone: boilerplate.internal
associada a VPC atual
sem records internos ainda
```

Evolucoes PoC depois:

```text
criar records somente quando existirem destinos reais
api.boilerplate.internal quando houver Load Balancer/Gateway interno adequado
postgres.boilerplate.internal quando houver RDS
redis.boilerplate.internal quando houver Redis
avaliar ExternalDNS quando Kubernetes comecar a gerenciar entradas
```

Evolucoes projeto maior:

```text
padrao de nomes por ambiente
Private Hosted Zones por ambiente ou dominio
separar claramente nomes publicos e nomes internos da mesma aplicacao
associacao com multiplas VPCs
conta central de DNS
Route 53 Resolver inbound/outbound endpoints para DNS hibrido
Resolver rules compartilhadas
integracao com DNS corporativo/on-premises
```

## ECR / container registry

Estado atual:

```text
ECR repository da app NestJS
imageTagMutability IMMUTABLE
scanOnPush habilitado
lifecycle policy mantendo as ultimas 20 imagens
```

Evolucoes PoC depois:

```text
fazer login no ECR via AWS CLI
buildar imagem Docker da app
criar tag unica para imagem
fazer push para o repositoryUrl exportado pelo Pulumi
usar essa imagem no Deployment Kubernetes
```

Evolucoes projeto maior:

```text
CI/CD fazendo build e push
OIDC do GitHub Actions para AWS
repository policy para CI/CD
cross-account pull se houver multiplas contas
KMS customizado se necessario
scan avancado com gates
assinatura de imagem
repos separados para workers, migrations e imagens customizadas
replicacao multi-region se houver necessidade
```

## VPC endpoints

Estado atual:

```text
nao criados
saida privada depende de NAT Gateway por enquanto
```

Evolucoes PoC depois:

```text
criar endpoints para ECR API e ECR Docker
criar S3 Gateway Endpoint se necessario para layers do ECR
criar endpoint para CloudWatch Logs
criar endpoint para STS
criar endpoint para Secrets Manager ou SSM quando runtime secrets entrarem
```

Evolucoes projeto maior:

```text
reduzir ou eliminar dependencia de NAT para workloads privados
SG dedicado para interface endpoints
policies restritivas por endpoint
custos comparados entre NAT e endpoints
```

## EKS cluster

Estado atual:

```text
cluster EKS ainda nao criado
recurso aws.eks.Cluster modelado no Pulumi
preview validado para criar o control plane sem node group
IAM role do control plane criada
trust policy permite assume role por eks.amazonaws.com
AmazonEKSClusterPolicy anexada
```

Evolucoes PoC depois:

```text
aplicar EKS cluster
usar clusterRoleArn exportado pela IAM role do control plane
usar subnets privadas para nodes
configurar cluster logging minimo
criar node group gerenciado
validar kubeconfig/acesso ao cluster
```

Evolucoes projeto maior:

```text
endpoint privado do control plane
controle refinado de acesso ao cluster
logs de audit/api/authenticator/controllerManager/scheduler
Karpenter para autoscaling avancado
separacao de node pools por workload
upgrade strategy de Kubernetes
```

## IAM / IRSA / acesso de workloads

Estado atual:

```text
IAM role do control plane EKS criada
IAM role dos nodes EKS criada
AmazonEKS_CNI_Policy anexada na node role para simplificar a PoC
IRSA ainda nao criado
```

Evolucoes PoC depois:

```text
criar OIDC provider do EKS
estudar como o aws-node usa permissoes de rede via AmazonEKS_CNI_Policy
criar roles para service accounts de controllers
criar role da app quando ela precisar acessar AWS APIs
estudar EKS Pod Identity como alternativa moderna ao IRSA
```

### EKS Pod Identity

Objetivo de aprendizado:

```text
comparar IRSA com EKS Pod Identity para permissao IAM de workloads no EKS
entender o papel do EKS Pod Identity Agent
criar uma Pod Identity Association entre namespace, service account e IAM role
testar acesso AWS a partir de um pod sem ampliar permissoes da node role
avaliar operacao, troubleshooting e seguranca em relacao ao IRSA
```

Diretriz:

```text
manter IRSA como base inicial da PoC
usar EKS Pod Identity como evolucao controlada depois que IRSA estiver entendido
comecar por uma app simples que acesse uma AWS API pequena, como S3, SSM ou Secrets Manager
evitar migrar controllers criticos antes de validar bem o fluxo
```

Evolucoes projeto maior:

```text
least privilege por workload
mover AmazonEKS_CNI_Policy da node role para uma role IRSA especifica do service account aws-node
permission boundaries se a empresa exigir
roles separadas por ambiente
auditoria de policies IAM
OIDC para CI/CD
```

## Organizacao dos arquivos IaC

Estado atual:

```text
arquivos dentro de dominios seguem o padrao src/<dominio>/<dominio>-<assunto>.ts
exemplos: network/network-vpc.ts, cluster/cluster-eks-iam.ts, dns/dns-private-zone.ts
arquivos raiz como config.ts, names.ts e tags.ts ainda ficam diretamente em src
```

Evolucoes PoC depois:

```text
manter o prefixo do dominio ao criar novos componentes
evitar nomes redundantes como dns-internal-dns.ts
avaliar se arquivos raiz devem ir para um dominio core
```

Evolucoes projeto maior:

```text
documentar convencoes de modulo, classe e exports publicos
separar componentes compartilhados em dominio proprio se a IaC crescer
separar add-ons e workloads Kubernetes em gitops/ na raiz do repositorio quando houver Argo CD/GitOps
manter IaC cloud para VPC, EKS, IAM, OIDC e roles IRSA
manter manifests/Helm/Kustomize reconciliados pelo Argo fora de IaC/
```

## GitOps / Argo CD

Estado atual:

```text
Argo CD criado via Pulumi Helm
root Application criada pelo Pulumi como bootstrap app-of-apps
gitops/ criado na raiz do repositorio
smoke app migrada para manifests GitOps com Kustomize
workloads Kubernetes nao sao mais modelados diretamente no Pulumi
acesso privado do Argo via Ingress internal criado em gitops/argocd/internal-access
ALB internal do Argo reconciliado pelo AWS Load Balancer Controller
ExternalDNS criado via Pulumi Helm com IRSA
argocd.boilerplate.internal criado na Private Hosted Zone boilerplate.internal
acesso HTTP ao Argo validado de dentro da VPC/cluster
sync-waves revisados para external-secrets, stores, private-origin-gateway, cert-manager e smoke app
erro de dependencia entre root app e CRD Application do Argo identificado e corrigido no Pulumi com dependencia explicita do Helm release
contrato do SG do NLB do Envoy para o private-origin-gateway resolvido via CRD de SSM
```

Evolucoes PoC depois:

```text
adicionar certificado para o acesso privado do Argo
avaliar ACM privado/publico ou cert-manager para emitir o certificado
mapeamento de rede/DNS corporativo para acessar argocd.boilerplate.internal fora da VPC, se necessario
padronizar contratos foundation -> GitOps para outros valores nao sensiveis usados em annotations/manifests antes do render
manter IAM, IRSA, EKS, VPC, ECR e DNS base no Pulumi
```

Evolucoes projeto maior:

```text
criar AppProject para organizar permissoes do Argo
avaliar Ingress privado para argocd.boilerplate.internal
usar ALB internal ou Gateway interno para acesso privado ao Argo
associar DNS na Private Hosted Zone boilerplate.internal
definir TLS interno para a URL privada do Argo
integrar login com SSO/OIDC
evitar exposicao publica do Argo CD
```

## Pulumi Kubernetes Operator

Estado atual:

```text
nao usado
Pulumi ainda roda pela maquina local ou Makefile
Argo CD reconcilia apenas manifests Kubernetes e Applications
```

Evolucao avancada para aprendizado:

```text
estudar Pulumi Kubernetes Operator somente no final da stack
usar como laboratorio de platform engineering e GitOps para infraestrutura
entender Stack CR, control loop, status de reconciliacao e execucao de Pulumi dentro do cluster
avaliar como preview, update e outputs funcionam quando a stack e reconciliada por operador
comparar com o modelo CI/CD rodando pulumi preview/up fora do cluster
```

Pre-requisitos antes de estudar PKO:

```text
Argo CD app-of-apps estabilizado
workloads da app reconciliados por GitOps
Envoy Gateway e rotas definidos
secrets resolvidos com estrategia segura, como External Secrets e AWS Secrets Manager
CI publicando imagem e rodando validacoes
RBAC, IRSA e boundaries bem entendidos
```

Cuidados para projeto maior:

```text
cluster passa a ter permissoes para criar ou alterar infraestrutura cloud
IRSA do operador precisa seguir menor privilegio
Stack CRs precisam de controle por RBAC e revisao
secrets/config de stacks nao devem ficar em texto claro no Git
preview em PR continua importante antes do merge
PKO complementa Argo CD, mas nao substitui Argo para workloads Kubernetes
```

## Add-ons do EKS

Estado atual:

```text
CoreDNS criado pelo EKS e reduzido para 1 replica via patch Pulumi para caber na PoC single-node
AWS Load Balancer Controller reduzido para 1 replica na PoC single-node
Metrics Server declarado como add-on via Argo CD para habilitar a API metrics.k8s.io usada pelo HPA
```

Evolucoes PoC depois:

```text
VPC CNI
CoreDNS com 2 replicas quando o node group voltar a ter capacidade adequada
kube-proxy
EBS CSI Driver se houver volumes
```

Ordem sugerida para autoscaling:

```text
sincronizar o Metrics Server pelo Argo CD
validar kubectl top pods e kubectl top nodes
validar HPA do smoke app depois que metrics.k8s.io estiver disponivel
estudar Karpenter somente depois de borda publica, observabilidade minima, requests/limits e HPA
estudar KEDA somente se houver workload orientado a eventos, fila ou metrica externa
```

Evolucoes projeto maior:

```text
versoes pinadas dos add-ons
monitoramento de saude dos add-ons
politicas de upgrade
Karpenter ou Cluster Autoscaler para autoscaling de nodes
reconciliar add-ons via Argo CD em vez de Pulumi Helm quando a plataforma GitOps existir
```

## AWS Load Balancer Controller

Estado atual:

```text
criado via Pulumi Helm
ServiceAccount kube-system/aws-load-balancer-controller anotado com role IRSA
Deployment READY 2/2
Ingress publico temporario reconciliado
ALB publico criado e health check validado
```

Evolucoes PoC depois:

```text
validar descoberta de subnets por tags
entender como anexar ou controlar SG do Load Balancer
criar NLB publico para expor o Envoy Gateway quando o desenho de gateway estiver pronto
```

Evolucoes projeto maior:

```text
separar permissoes do controller por ambiente
validar annotations padrao
monitorar reconciliacao do controller
padronizar ALB vs NLB por caso de uso
evitar ALB como camada L7 redundante quando Envoy assumir a borda HTTP
```

## Envoy Gateway / Gateway API

Estado atual:

```text
Envoy Gateway instalado via GitOps como add-on/control plane
GatewayClass envoy-gateway criado
Gateway private-origin-gateway definido em gitops/cluster/private-origin-gateway
EnvoyProxy private-origin-envoy-proxy definido para customizar o data plane
NLB internal criado para o Envoy data plane atuar como origem privada do CloudFront VPC Origin
cross-zone load balancing habilitado no NLB para a PoC com node group pequeno
HTTPRoute da smoke app definido para rotear pelo private-origin-gateway
SG do NLB fornecido ao EnvoyProxy de forma declarativa via CRD de SSM antes do render do Argo CD
fluxo alvo continua sendo CloudFront -> VPC Origin -> NLB privado -> Envoy -> HTTPRoute -> Service interno
```

Validado nesta etapa:

```text
NLB do Envoy mantido como internal para servir como origem privada do CloudFront VPC Origin
externalTrafficPolicy Local mantido para o NLB registrar somente nodes capazes de atender trafego localmente
data plane do Envoy Gateway criado como DaemonSet, garantindo um Envoy por node elegivel
node group atual marcado com label boilerplate.dev/node-pool=gateway
DaemonSet do Envoy restrito com nodeSelector boilerplate.dev/node-pool=gateway
requests e limits do Envoy definidos para deixar consumo previsivel
PDB do Envoy criado com maxUnavailable 1 para upgrades controlados
CRD real do EnvoyProxy aceitou envoyDaemonSet e envoyPDB
target health do NLB validado com todos os targets healthy depois da reconciliacao do Argo CD
CRD de SSM validado para propagar o SG do NLB ao EnvoyProxy sem hardcode no Git
fluxo CloudFront VPC Origin -> NLB privado -> Envoy -> HTTPRoute -> Service interno validado
```

Evolucoes PoC depois:

```text
validar resolucao DNS privada de api.boilerplate.internal a partir de rede/VPN com acesso a Private Hosted Zone
```

Evolucoes projeto maior:

```text
avaliar Cilium/WireGuard, Linkerd ou Istio apenas em uma etapa posterior de trafego leste-oeste
definir estrategia de identidade de workloads para trafego leste-oeste
avaliar BackendTLSPolicy apenas para casos Envoy -> backend com TLS direto
rate limiting
timeouts e retries padronizados
traffic splitting/canary
observabilidade de access logs e metricas
politicas de seguranca no gateway
```

Roadmap de seguranca de trafego:

```text
1. Manter Envoy Gateway para entrada norte-sul.
2. Adicionar TLS termination no Envoy para trafego cliente -> gateway.
3. Implementar borda publica com CloudFront + AWS WAF para o caminho externo.
4. Usar CloudFront VPC origin para chegar em NLB privado quando possivel, mantendo CloudFront como unico ponto publico.
5. Manter DNS/Gateway interno para o caminho privado.
6. Depois avaliar Cilium/WireGuard, Linkerd ou Istio se houver requisito claro de trafego leste-oeste.
```

Decisao PoC:

```text
Nao terminar TLS no NLB nesta etapa.
O NLB deve continuar como transporte L4, e o Gateway API deve declarar o listener HTTPS.
BackendTLSPolicy nao substitui service mesh para trafego interno entre apps.
BackendTLSPolicy e util apenas para controlar TLS no trecho Envoy -> backend especifico.
```

## App Kubernetes

Estado atual:

```text
smoke app implantada em GitOps no EKS
namespace, ServiceAccount, RBAC, ConfigMap, ExternalSecret, Deployment, Service, PDB, HPA e HTTPRoute aplicados
requests/limits, probes e securityContext configurados
imagem da smoke app publicada no ECR Public com referencia mutavel para a PoC
```

Evolucoes PoC depois:

```text
evoluir a smoke app para um workload real quando houver necessidade de negocio
migrar a imagem para ECR privado quando fizer sentido
ajustar o desenho de observabilidade da app com metricas e logs reais
```

Evolucoes projeto maior:

```text
Karpenter para escala de nodes quando houver necessidade real
KEDA para eventos ou metricas externas quando houver justificativa
service mesh apenas se houver requisito claro de trafego leste-oeste
Pod Security Standards e NetworkPolicy quando houver mais workloads
```

## Runtime secrets

Estado atual:

```text
nao criado
```

Evolucoes PoC depois:

```text
usar AWS Secrets Manager como backend de secrets da app
instalar External Secrets Operator no EKS
criar IAM role IRSA para o External Secrets Operator ler secrets permitidos
criar SecretStore ou ClusterSecretStore apontando para AWS Secrets Manager
criar ExternalSecret da smoke app em GitOps
Deployment da app consumindo o Kubernetes Secret gerado pelo External Secrets Operator
manter valores sensiveis fora do Git
```

Evolucoes projeto maior:

```text
rotacao de secrets
KMS customizado
separacao por ambiente
auditoria de acesso
politica de menor privilegio por secret
avaliar Secrets Store CSI Driver quando secrets como arquivos forem preferiveis a env vars
```

## Banco e cache

Estado atual:

```text
RDS ainda nao criado
Redis ainda nao criado
Mongo/DocumentDB/Atlas ainda nao definido
```

Evolucoes PoC depois:

```text
RDS subnet group
SG do RDS permitindo app
RDS PostgreSQL privado
ElastiCache subnet group
SG do Redis permitindo app
Redis privado
```

Evolucoes projeto maior:

```text
Multi-AZ para RDS
backup e retention adequados
deletion protection
janela de manutencao
criptografia KMS
monitoramento e alarmes
estrategia de migrations
avaliar Atlas vs DocumentDB para Mongo
```

## Observabilidade

Estado atual:

```text
nao criada
```

Evolucoes PoC depois:

```text
CloudWatch Logs para pods
logs do Envoy
Metric alarms basicos para Load Balancer
Metric alarms basicos para RDS/Redis quando existirem
```

Evolucoes projeto maior:

```text
OpenTelemetry Collector
tracing distribuido
Prometheus/Grafana ou stack equivalente
Container Insights
dashboards por servico
SLOs e alertas de erro/latencia
retencao de logs por ambiente
```

## CI/CD

Estado atual:

```text
nao criado
```

Evolucoes PoC depois:

```text
comando/documentacao para build e push local no ECR
GitHub Actions para build Docker
push para ECR
atualizacao de tag de imagem no deploy
pulumi preview no PR
pulumi up no ambiente dev
```

Evolucoes projeto maior:

```text
OIDC sem secrets estaticos
aprovacoes por ambiente
promocao de imagem entre ambientes
scans obrigatorios
rollback automatizado ou documentado
post-deploy health check
```

## Custo e governanca

Estado atual:

```text
tags padrao existem
sandbox pode resetar diariamente
sem budgets/alarms ainda
```

Evolucoes PoC depois:

```text
acompanhar custo de NAT Gateway, EKS e Load Balancer
usar make reset quando a sandbox apagar recursos
```

Evolucoes projeto maior:

```text
AWS Budgets
Cost alerts
politica de tags obrigatorias
log retention controlado
lifecycle policies para ECR e logs
estrategia de destroy por ambiente nao produtivo
```

## Proximos passos imediatos da PoC

Ordem sugerida a partir do estado atual:

```text
1. Consolidar e documentar o contrato do SG do NLB do Envoy via CRD de SSM no GitOps do private-origin-gateway
2. Validar o Karpenter controller e o NodePool app no cluster
3. Validar observabilidade minima da borda, Envoy e app
4. Estudar KEDA somente se houver fila, evento ou metrica externa que justifique autoscaling por evento
5. Avaliar service mesh (Cilium/WireGuard, Linkerd ou Istio) apenas se houver requisito claro de trafego leste-oeste
```

Observabilidade minima no `edge`:

```text
CloudFront com logs de acesso enviados para o bucket de logs
WAF com metricas e requests amostrados habilitados
alarms basicos para 4xx/5xx do CloudFront, latencia/origem e requests bloqueadas pelo WAF
```

Este documento deve continuar acompanhando a PoC conforme cada etapa sair do backlog e virar infraestrutura real.
