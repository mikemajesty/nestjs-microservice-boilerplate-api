# Passo a passo da PoC EKS com Pulumi

Este arquivo e um roteiro curto para lembrar a ordem em que a infraestrutura foi criada.

## 1. Preparar acesso AWS

1. Criar/configurar o profile AWS local com SSO.
2. Usar o profile `IaC-profile`.
3. Fazer login:

```bash
aws sso login --profile IaC-profile
```

4. Confirmar a conta ativa:

```bash
AWS_PROFILE=IaC-profile aws sts get-caller-identity
```

## 2. Preparar stack Pulumi por conta

1. Entrar na pasta da IaC:

```bash
cd IaC
```

2. Selecionar ou criar uma stack baseada na conta AWS atual:

```bash
make select-account-stack
```

Motivo: evitar reaproveitar state com recursos e ARNs de outra conta AWS.

## 3. Criar a base de rede

1. Criar VPC.
2. Criar subnets publicas e privadas.
3. Criar Internet Gateway para subnets publicas.
4. Criar NAT Gateway para saida das subnets privadas.
5. Criar security group inicial para futura borda publica.

Validacao:

```bash
make preview
make up
```

## 4. Criar DNS interno

1. Criar uma private hosted zone.
2. Associar a zona privada com a VPC.

Objetivo: preparar nomes internos para servicos privados.

## 5. Criar registro de imagem

1. Tentar ECR privado.
2. Identificar bloqueio por permissao/SCP.
3. Usar ECR Public para a PoC.
4. Expor no output do Pulumi a URL do repositorio.

Imagem usada:

```text
public.ecr.aws/d7z1o0q8/nestjs-boilerplate-dev-app:latest
```

## 6. Criar EKS control plane

1. Criar IAM role do cluster.
2. Permitir trust para o servico do EKS.
3. Anexar policy gerenciada `AmazonEKSClusterPolicy`.
4. Criar o cluster EKS.
5. Habilitar endpoint publico e privado.
6. Habilitar logs `api`, `audit` e `authenticator`.

Validacao:

```bash
make preview
make up
```

## 7. Criar node IAM

1. Criar IAM role para os worker nodes.
2. Permitir trust para EC2.
3. Anexar policies:

```text
AmazonEKSWorkerNodePolicy
AmazonEKS_CNI_Policy
AmazonEC2ContainerRegistryReadOnly
```

## 8. Criar managed node group

1. Criar node group gerenciado pelo EKS.
2. Usar subnets privadas.
3. Comecar pequeno:

```text
min: 1
desired: 1
max: 2
instance type: t3.small
```

4. Validar se o node entrou no cluster:

```bash
kubectl get nodes
```

## 9. Criar app smoke temporaria

1. Simplificar o `src/main.ts` para uma app NestJS minima.
2. Criar rota `/`.
3. Criar rota `/health`.
4. Usar porta `5000`.

Objetivo: testar runtime no EKS antes de voltar para a app completa.

## 10. Buildar e publicar imagem Docker

1. Buildar a imagem da app.
2. Publicar no ECR Public.
3. Como o Mac pode buildar `arm64`, forcar imagem `linux/amd64` para rodar no node `t3.small`.

Comando usado:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t public.ecr.aws/d7z1o0q8/nestjs-boilerplate-dev-app:latest \
  --push .
```

Validacao do manifesto:

```bash
docker manifest inspect public.ecr.aws/d7z1o0q8/nestjs-boilerplate-dev-app:latest | grep -E 'architecture|os|platform'
```

Esperado:

```text
architecture: amd64
os: linux
```

## 11. Conectar Pulumi ao Kubernetes

1. Instalar `@pulumi/kubernetes` na pasta `IaC`.
2. Criar um provider Kubernetes usando os outputs do cluster EKS.
3. Gerar kubeconfig dinamicamente.
4. Usar token do EKS via `aws.eks.getClusterAuthOutput`.

Objetivo: deixar o Pulumi criar recursos AWS e Kubernetes no mesmo grafo.

## 12. Criar namespace da app

1. Criar namespace Kubernetes para o workload.
2. Nome usado:

```text
nestjs-boilerplate-dev-workload
```

3. Aplicar labels basicas de app, ambiente e gerenciamento.

## 13. Criar Deployment e Service

1. Criar Deployment do smoke app.
2. Usar a imagem publicada no ECR Public.
3. Configurar readiness probe em `/health`.
4. Configurar liveness probe em `/health`.
5. Criar Service do tipo `ClusterIP`.

Motivo do `ClusterIP`:

```text
a app deve ficar privada dentro do cluster
a entrada publica deve vir depois por Ingress/Gateway/Envoy
```

Validacao:

```bash
make preview
make up
```

## 14. Resolver erro de arquitetura da imagem

Erro encontrado:

```text
ImagePullBackOff
no match for platform in manifest
```

Causa:

```text
imagem publicada como linux/arm64
node do EKS rodando x86_64/amd64
```

Solucao:

```bash
docker buildx build --platform linux/amd64 --push ...
```

Depois rodar novamente:

```bash
make up
```

## 15. Testar se a app subiu

1. Verificar rollout:

```bash
kubectl rollout status deployment/nestjs-boilerplate-dev-smoke-app -n nestjs-boilerplate-dev-workload
```

2. Ver pods:

```bash
kubectl get pods -n nestjs-boilerplate-dev-workload
```

3. Ver service:

```bash
kubectl get svc -n nestjs-boilerplate-dev-workload
```

4. Fazer port-forward local:

```bash
kubectl port-forward -n nestjs-boilerplate-dev-workload svc/nestjs-boilerplate-dev-smoke-app 5000:5000
```

5. Testar health check:

```bash
curl http://localhost:5000/health
```

## 16. Resultado final

Ao final, a PoC tinha:

```text
VPC
subnets publicas e privadas
NAT Gateway
private hosted zone
ECR Public
EKS control plane
IAM role do cluster
IAM role dos nodes
managed node group
Kubernetes provider no Pulumi
namespace
Deployment
Service ClusterIP
pod rodando
health check respondendo via port-forward
```

## 17. Criar OIDC provider para IRSA

1. Expor o issuer OIDC do cluster EKS no componente do cluster.
2. Criar o IAM OpenID Connect Provider apontando para o issuer do EKS.
3. Usar audience:

```text
sts.amazonaws.com
```

Objetivo: permitir que ServiceAccounts do Kubernetes assumam IAM Roles via IRSA.

Validacao:

```bash
make preview
make up
```

## 18. Criar IAM do AWS Load Balancer Controller

1. Criar IAM Policy do controller.
2. Criar IAM Role com trust em `sts:AssumeRoleWithWebIdentity`.
3. Restringir a trust policy ao ServiceAccount:

```text
system:serviceaccount:kube-system:aws-load-balancer-controller
```

4. Anexar a policy na role.

Objetivo: permitir que o controller crie e configure ALB, listeners, target groups e regras de rede na AWS.

## 19. Instalar AWS Load Balancer Controller

1. Instalar o Helm chart `aws-load-balancer-controller` pelo Pulumi.
2. Usar namespace:

```text
kube-system
```

3. Criar ServiceAccount anotado com a role IRSA:

```text
eks.amazonaws.com/role-arn
```

Validacao:

```bash
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
kubectl get serviceaccount -n kube-system aws-load-balancer-controller -o yaml
```

Resultado esperado:

```text
Deployment READY 2/2
Pods Running
ServiceAccount com annotation eks.amazonaws.com/role-arn
```

## 20. Criar Ingress publico temporario

1. Criar um Ingress para a smoke app.
2. Usar classe:

```text
alb
```

3. Configurar annotations principais:

```text
alb.ingress.kubernetes.io/scheme: internet-facing
alb.ingress.kubernetes.io/target-type: ip
alb.ingress.kubernetes.io/listen-ports: [{"HTTP":80}]
alb.ingress.kubernetes.io/healthcheck-path: /health
```

4. Apontar o backend para o Service ClusterIP da smoke app na porta `5000`.

Motivo: validar acesso pelo browser sem `kubectl port-forward`.

## 21. Validar acesso publico via ALB

1. Ver o Ingress:

```bash
kubectl get ingress -n nestjs-boilerplate-dev-workload
```

Endereco criado:

```text
k8s-nestjsbo-nestjsbo-cd4756c7d1-1280881540.us-east-1.elb.amazonaws.com
```

2. Testar health check publico:

```bash
curl http://k8s-nestjsbo-nestjsbo-cd4756c7d1-1280881540.us-east-1.elb.amazonaws.com/health
```

Resultado:

```json
{ "status": "healthy" }
```

3. Ver detalhes do Ingress:

```bash
kubectl describe ingress -n nestjs-boilerplate-dev-workload nestjs-boilerplate-dev-smoke-app-public-ingress
```

Backend observado:

```text
nestjs-boilerplate-dev-smoke-app:5000 (10.0.87.184:5000)
```

4. Validar Target Group na AWS:

```bash
AWS_PROFILE=IaC-profile AWS_PAGER=cat aws --no-cli-pager elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:<aws-account-id>:targetgroup/<target-group-name>/<target-group-id> \
  --output table
```

Resultado observado:

```text
Target Id: 10.0.87.184
Port: 5000
HealthCheckPort: 5000
TargetHealth.State: healthy
```

Fluxo validado:

```text
Browser/curl
-> ALB publico HTTP 80
-> Target Group target-type ip
-> Pod 10.0.87.184:5000
-> /health
```

## 22. Proximo passo natural

Depois do smoke app privado funcionar:

```text
Load Balancer publico
-> Gateway/Ingress/Envoy
-> Service ClusterIP
-> Pods da app
```

Depois do ALB temporario funcionar, o proximo passo arquitetural e discutir Envoy Gateway:

```text
NLB publico
-> Envoy Gateway
-> HTTPRoute
-> Service ClusterIP
-> Pods da app
```

## 23. Limpeza no fim do dia

Como a PoC cria recursos pagos, destruir a stack quando terminar:

```bash
make teardown
```

Ou diretamente:

```bash
AWS_PROFILE=IaC-profile pulumi destroy --yes
```
