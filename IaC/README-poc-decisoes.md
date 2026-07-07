# Decisoes da PoC vs projeto maior

Este documento registra escolhas feitas porque esta infraestrutura ainda e uma PoC de estudo. A ideia e deixar claro o que foi simplificado agora, por que foi simplificado, e como seria tratado em um projeto maior.

Este arquivo deve ser atualizado a cada nova etapa da infraestrutura.

## Contexto da PoC

Objetivo atual:

```text
Criar uma app NestJS privada no EKS, com entrada externa por Load Balancer publico e Envoy Gateway.
```

Estado atual da infraestrutura:

```text
Pulumi TypeScript
VPC com subnets publicas e privadas
Security Group inicial para futuro Load Balancer publico
Route 53 Private Hosted Zone
ECR repository da app
Makefile com fluxo de reset para sandbox
```

A conta usada e uma sandbox que pode resetar recursos todos os dias. Por isso algumas decisoes privilegiam aprendizado, recriacao rapida e leitura clara do codigo.

## VPC com awsx

Escolha da PoC:

```text
Usar @pulumi/awsx para criar VPC, subnets, route tables, Internet Gateway e NAT Gateway.
```

Por que fizemos assim:

```text
A divisao de CIDR, criacao de subnets por AZ, route tables e NAT envolvem muita mecanica.
Para a PoC, o foco nao e escrever algoritmo de enderecamento de rede.
```

Em projeto maior, poderiamos avaliar:

```text
modulo proprio de VPC com @pulumi/aws
controle explicito de CIDRs por subnet
NAT Gateway por AZ
VPC endpoints para reduzir dependencia de NAT
NACLs especificas por camada
Transit Gateway ou VPC peering se houver multiplas VPCs
```

Decisao atual:

```text
Manter awsx para composicao mecanica da rede base.
Usar @pulumi/aws quando a decisao arquitetural precisar ficar explicita.
```

## Duas AZs

Escolha da PoC:

```text
availabilityZoneCount: 2
```

Resultado:

```text
2 subnets publicas
2 subnets privadas
```

Por que fizemos assim:

```text
Duas AZs ja permitem estudar alta disponibilidade basica sem aumentar custo e complexidade demais.
```

Em projeto maior, poderiamos avaliar:

```text
3 AZs para maior resiliencia
subnets separadas por tipo de workload
planejamento formal de CIDR por ambiente
capacidade de crescimento por regiao
```

## Single NAT Gateway

Escolha da PoC:

```text
singleNatGateway: true
```

Por que fizemos assim:

```text
Reduz custo da sandbox e simplifica a topologia.
```

Tradeoff:

```text
Menor resiliencia. Se a AZ/NAT usado falhar, workloads privados podem perder saida para a internet.
```

Em projeto maior, poderiamos avaliar:

```text
NAT Gateway por AZ
VPC endpoints para ECR, CloudWatch Logs, STS, Secrets Manager e S3
estrategia sem NAT para workloads privados
```

## Security Group do futuro Load Balancer

Escolha da PoC:

```text
Criar publicLoadBalancerSecurityGroup antes do Load Balancer existir.
```

Por que fizemos assim:

```text
Security Group e uma fronteira logica de rede.
Ele pode existir antes do recurso que vai usa-lo.
Isso ajuda a estudar ingress, egress e regras separadas.
```

Regras atuais:

```text
ingress: HTTP TCP 80 vindo de 0.0.0.0/0
egress: all traffic para 0.0.0.0/0 temporariamente
```

Por que o egress esta temporario:

```text
Ainda nao existe Envoy Gateway, nem sabemos a porta/SG real do destino.
```

Em projeto maior ou etapa futura, devemos trocar por:

```text
egress do Load Balancer somente para o SG do Envoy/Gateway
porta especifica do Gateway
HTTPS 443 quando TLS publico entrar
WAF na borda publica se necessario
```

## Regras de Security Group separadas

Escolha da PoC:

```text
Criar aws.ec2.SecurityGroup e regras com aws.vpc.SecurityGroupIngressRule / SecurityGroupEgressRule.
```

Por que fizemos assim:

```text
Primeiro existem os grupos.
Depois existem as permissoes entre eles.
```

Isso ajuda a evitar acoplamento confuso quando os SGs comecarem a se referenciar.

Em projeto maior, manteria a mesma abordagem, principalmente para regras entre:

```text
Load Balancer -> Envoy
Envoy -> App
App -> RDS
App -> Redis
Workloads -> VPC endpoints
```

## ALB e Ingress publico temporario

Escolha da PoC:

```text
Instalar AWS Load Balancer Controller e criar um Ingress publico HTTP 80 para a smoke app.
```

Por que fizemos assim:

```text
Precisavamos validar acesso real pelo browser sem kubectl port-forward.
O ALB publico e o caminho mais rapido para testar a borda AWS com uma app HTTP simples.
```

O que foi validado:

```text
AWS Load Balancer Controller rodando no kube-system
ServiceAccount do controller usando IRSA
Ingress class alb reconciliado
ALB internet-facing criado
Target Group target-type ip criado
Pod 10.0.87.184:5000 registrado como target healthy
/health respondendo via DNS publico do ALB
```

Tradeoff:

```text
ALB e Ingress classico ficam como ponte temporaria de validacao.
Eles nao representam a arquitetura final desejada para gateway.
```

Arquitetura alvo:

```text
NLB publico
-> Envoy Gateway
-> HTTPRoute
-> Service ClusterIP
-> Pods da app
```

Decisao atual:

```text
Manter ALB/Ingress apenas como etapa temporaria da PoC.
Remover ou substituir essa camada quando Envoy Gateway estiver pronto.
```

## Route 53 Private Hosted Zone simples

Escolha da PoC:

```text
Criar uma Private Hosted Zone chamada boilerplate.internal associada a VPC.
```

Por que fizemos assim:

```text
Precisamos de uma base para nomes privados futuros, mas ainda nao temos recursos reais para criar records.
```

O que nao criamos agora:

```text
records DNS
Resolver inbound endpoint
Resolver outbound endpoint
Resolver rules
multi-account DNS
DNS hibrido com on-premises
```

Em projeto maior, poderiamos avaliar:

```text
dominio interno controlado pela empresa
padrao por ambiente, como api.dev.platform.internal
Private Hosted Zones por ambiente
associacao da zona com multiplas VPCs
conta central de DNS/networking
ExternalDNS para records gerenciados pelo Kubernetes
Route 53 Resolver endpoints para DNS hibrido
```

Decisao atual:

```text
Criar so a zona privada.
Criar records somente quando existir destino real.
```

## ECR repository da app

Escolha da PoC:

```text
Criar um ECR repository para a app NestJS.
```

Configuracao atual:

```text
imageTagMutability: IMMUTABLE
scanOnPush: true
lifecycle policy mantendo as ultimas 20 imagens
```

Por que fizemos assim:

```text
O EKS vai precisar puxar uma imagem da app de algum registry.
ECR e o registry privado natural dentro da AWS.
```

Por que tags imutaveis:

```text
Evita que a mesma tag passe a apontar para outra imagem depois do push.
```

Tradeoff na PoC:

```text
Nao usar latest como tag mutavel.
Usar tags unicas, como git SHA, versao ou timestamp.
```

Em projeto maior, poderiamos avaliar:

```text
KMS customizado
repository policies para CI/CD e cross-account
replicacao multi-region
assinatura de imagens
scan avancado e gates de seguranca
repos separados para app, workers, migrations e Envoy customizado se existir
```

## ECR sem VPC e sem Security Group

Escolha da PoC:

```text
ECR nao recebe vpcId, subnetId ou securityGroupId.
```

Motivo:

```text
ECR e um servico regional gerenciado da AWS, nao um recurso que mora dentro da VPC.
```

Em projeto maior, o acesso privado ao ECR pode envolver:

```text
VPC endpoint para ECR API
VPC endpoint para ECR Docker
S3 gateway endpoint para layers
Security Group dos VPC endpoints
```

Isso sera tratado quando decidirmos reduzir dependencia de NAT ou deixar o EKS mais privado.

## EKS Managed Node Group inicial

Escolha da PoC:

```text
Criar um Managed Node Group pequeno em subnets privadas.
```

Configuracao atual:

```text
minSize: 1
desiredSize: 1
maxSize: 2
instanceTypes: t3.small
maxUnavailable durante update: 1
```

Por que fizemos assim:

```text
O cluster EKS ja tem control plane, mas ainda precisa de nodes para rodar pods.
Um node pequeno reduz custo e ja permite validar kubelet, VPC CNI, CoreDNS e workloads simples.
O maxSize 2 deixa espaco minimo para estudar escala depois sem assumir requisitos reais da app.
```

Tradeoff na PoC:

```text
Nao e sizing definitivo da aplicacao.
Nao garante alta disponibilidade real de workloads.
Nao foi definido por carga, requests/limits, HPA ou SLOs.
```

Em projeto maior, deveriamos dimensionar por:

```text
CPU e memoria reais da app
requests e limits dos pods
quantidade de replicas
HPA/Karpenter/Cluster Autoscaler
distribuicao entre AZs
custo e estrategia de capacity type, como ON_DEMAND ou SPOT
```

## Sandbox reset diario

Escolha da PoC:

```text
Adicionar make reset.
```

Motivo:

```text
A conta sandbox pode apagar recursos todos os dias.
O Pulumi state pode ficar apontando para recursos que nao existem mais.
```

Fluxo atual:

```text
make reset
```

Executa:

```text
pulumi refresh
pulumi up
```

Em projeto maior, nao dependeriamos desse comportamento. O state seria preservado e os recursos nao seriam apagados diariamente fora do Pulumi.

## O que manter mesmo fora da PoC

Algumas escolhas sao boas tambem para projetos maiores:

```text
componentes por dominio
outputs claros por area
nomes padronizados
tags padrao
preview antes de up
regras de SG separadas
records DNS somente quando houver destino real
ECR com scan on push
lifecycle policy para imagens antigas
```

## O que esta simplificado por enquanto

```text
uma conta AWS
uma regiao
uma VPC
um ambiente dev
um NAT Gateway
sem VPC endpoints ainda
sem EKS ainda
sem records DNS ainda
sem Load Balancer real ainda
sem Envoy ainda
sem bancos/cache ainda
sem CI/CD ainda
```

Essas simplificacoes sao intencionais. A PoC deve crescer por micro etapas, validando cada conceito antes de adicionar a proxima camada.
