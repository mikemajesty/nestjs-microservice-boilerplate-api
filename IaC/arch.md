# Arquitetura da PoC EKS

## Estado atual: ALB publico temporario

```mermaid
flowchart TD
	Client[Cliente Externo / Browser] --> DNS[DNS publico do ALB]
	DNS --> ALB[ALB publico - HTTP 80]
	ALB --> TG[Target Group - target type ip]
	TG --> Pod[Pod Smoke App - 5000]

	Ingress[Ingress publico temporario - class alb] --> Controller[AWS Load Balancer Controller]
	Controller --> ALB
	Controller --> TG
	Service[Service ClusterIP - smoke app] --> Controller
	Pod --> Service
```

Fluxo de trafego atual:

```text
Browser
-> DNS do ALB
-> ALB publico
-> Target Group
-> Pod da smoke app
```

O `Ingress` nao recebe trafego diretamente. Ele declara a regra, o AWS Load Balancer Controller reconcilia essa regra e cria/configura o ALB, listener, rule e target group.

## Evolucao alvo: NLB + Envoy Gateway

```mermaid
flowchart TD
	Client[Cliente Externo / Browser] --> NLB[NLB publico - TCP 443]
	NLB --> Envoy[Envoy Gateway L7 - Pod]
	Envoy --> Service[Service ClusterIP - Alvo Logico]
	Service --> Pod1[Pod App 1]
	Service --> Pod2[Pod App 2]

	GatewayAPI[Gateway API / HTTPRoute] --> Envoy
	K8sAPI[API do Kubernetes] --> GatewayAPI
```

Fluxo alvo:

```text
Browser
-> NLB publico
-> Envoy Gateway
-> HTTPRoute
-> Service ClusterIP
-> Pods da app
```
