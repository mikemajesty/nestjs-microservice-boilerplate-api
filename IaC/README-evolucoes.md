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
publicLoadBalancerSecurityGroup criado
Ingress HTTP 80 publico
Egress temporario all traffic
```

Evolucoes PoC depois:

```text
criar SG do Envoy/Gateway quando o modelo do Gateway estiver definido
restringir egress do Load Balancer para o SG do Envoy
criar SG da app quando existir workload real
criar SG dos VPC endpoints quando endpoints forem criados
criar SG do RDS e Redis quando esses recursos existirem
```

Evolucoes projeto maior:

```text
HTTPS 443 na borda publica
WAF no Load Balancer publico
avaliar CloudFront na frente da borda publica para CDN, TLS, WAF e protecao adicional
regras de SG com menor privilegio
processo de revisao para regras publicas
NetworkPolicy dentro do Kubernetes
Security Groups for Pods se fizer sentido
```

## Borda publica / CDN

Estado atual:

```text
Ingress HTTP 80 publico temporario
ALB publico criado pelo AWS Load Balancer Controller
sem CloudFront
sem WAF
```

Evolucoes projeto maior:

```text
CloudFront -> CDN + WAF opcional na frente da borda publica
usar ACM para TLS publico
avaliar origin como ALB temporario ou NLB/Envoy quando o gateway estiver pronto
proteger a origem para receber trafego somente da camada de borda quando possivel
avaliar cache policy, origin request policy e logs de acesso
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
```

Evolucoes PoC depois:

```text
adicionar certificado para o acesso privado do Argo
avaliar ACM privado/publico ou cert-manager para emitir o certificado
mapeamento de rede/DNS corporativo para acessar argocd.boilerplate.internal fora da VPC, se necessario
migrar Gateway/HTTPRoute e futuros add-ons para GitOps
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
```

Evolucoes PoC depois:

```text
VPC CNI
CoreDNS com 2 replicas quando o node group voltar a ter capacidade adequada
kube-proxy
Metrics Server
EBS CSI Driver se houver volumes
```

Evolucoes projeto maior:

```text
versoes pinadas dos add-ons
monitoramento de saude dos add-ons
politicas de upgrade
Karpenter ou Cluster Autoscaler
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
Gateway interno compartilhado criado em gitops/cluster/internal-gateway
EnvoyProxy internal-envoy-proxy criado para customizar o data plane
NLB internet-facing criado temporariamente para o Envoy data plane, permitindo acesso direto pelo browser na PoC
cross-zone load balancing habilitado no NLB para a PoC com node group pequeno
HTTPRoute da smoke app roteando pelo internal-gateway sem hostname fixo para aceitar o hostname bruto do ELB na PoC
fluxo browser -> NLB publico -> Envoy -> HTTPRoute -> Service interno validado como atalho temporario de PoC
```

Evolucoes PoC depois:

```text
voltar o NLB do Envoy para internal quando houver VPN/bastion/resolucao privada adequada
validar resolucao DNS privada de api.boilerplate.internal a partir de rede/VPN com acesso a Private Hosted Zone
manter Envoy -> app em HTTP enquanto o foco for TLS norte-sul
validar fluxo HTTPS cliente -> NLB -> Envoy -> HTTPRoute -> Service interno
```

Evolucoes projeto maior:

```text
remover Ingress classico quando Envoy Gateway estiver pronto
avaliar Linkerd ou Istio para mTLS interno entre workloads
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
3. Depois avaliar Linkerd ou Istio para mTLS interno app -> app.
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
app ainda nao implantada no EKS
namespace da smoke app criado em GitOps
Deployment e ClusterIP Service basicos da smoke app criados em GitOps
readiness/liveness probes basicas configuradas
imagem da smoke app pinada por digest do ECR Public
```

Evolucoes PoC depois:

```text
service account da app
RBAC minimo da app para aprendizado de ServiceAccount, Role e RoleBinding
ConfigMap basico
Secret da app via AWS Secrets Manager e External Secrets Operator
Deployment consumindo ConfigMap e Secret via envFrom
requests/limits iniciais
securityContext de pod/container
ajustar readiness/liveness probes com tempos explicitos
validar imagem do ECR Public ou evoluir para ECR privado quando fizer sentido
```

Evolucoes projeto maior:

```text
HPA/KEDA se necessario
Pod Disruption Budget
Pod Security Standards
NetworkPolicy
separacao entre API, worker e jobs
RBAC por workload com menor privilegio e justificativa explicita para cada permissao
ServiceAccount com IRSA para workloads que acessam AWS APIs
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
1. Sincronizar cluster-public-gateway apontando para gitops/cluster/internal-gateway e validar prune dos recursos public-*
2. Renomear a Application do Argo de cluster-public-gateway para cluster-internal-gateway depois do prune validado
3. Validar resolucao DNS privada de api.boilerplate.internal a partir de rede/VPN com acesso a Private Hosted Zone
4. Adicionar certificado para o acesso privado do Argo
5. Comecar endurecimento da app: ServiceAccount, RBAC minimo, ConfigMap, Secrets e resources
6. Depois avaliar Linkerd ou Istio para mTLS interno entre workloads
```

Este documento deve continuar acompanhando a PoC conforme cada etapa sair do backlog e virar infraestrutura real.
