# Deployment do OpenTelemetry Collector + Zipkin

## 📋 Status

- ✅ metrics-server: Já está instalado (v3.13.0)
- 🚀 OpenTelemetry Collector: Criado
- 🚀 Zipkin: Criado
- ⏳ Prometheus, Grafana, Loki: Próximas etapas

## 🎯 Arquivos Criados

```
gitops/argocd/applications/
  ├── monitoring-namespace.yaml     # Namespace 'monitoring' para observabilidade
  ├── zipkin.yaml                   # Zipkin v2.24 (chart 0.3.0)
  └── otel-collector.yaml           # OpenTelemetry Collector (chart 0.92.0)
```

## 🚀 Deployment

### 1. Verificar se o namespace será criado
```bash
kubectl get namespace monitoring 2>/dev/null || echo "Namespace não existe, será criado pelo ArgoCD"
```

### 2. Sync das aplicações via ArgoCD
As aplicações foram criadas com:
- **sync-wave**: 15 (zipkin) e 20 (collector) - garante que zipkin inicia primeiro
- **CreateNamespace=true**: namespace será criado automaticamente
- **automated.prune=true**: limpeza automática

```bash
# Via ArgoCD CLI:
argocd app sync zipkin
argocd app sync otel-collector

# Ou via kubectl apply:
kubectl apply -f gitops/argocd/applications/monitoring-namespace.yaml
kubectl apply -f gitops/argocd/applications/zipkin.yaml
kubectl apply -f gitops/argocd/applications/otel-collector.yaml
```

### 3. Aguardar rollout
```bash
# Zipkin
kubectl rollout status deployment/zipkin -n monitoring --timeout=5m

# OpenTelemetry Collector
kubectl rollout status daemonset/otel-collector -n monitoring --timeout=5m
```

## ✅ Validação

### 1. Verificar se os pods estão rodando
```bash
kubectl get pods -n monitoring -l app.kubernetes.io/name=zipkin
kubectl get pods -n monitoring -l app.kubernetes.io/name=opentelemetry-collector
```

### 2. Verificar endpoints (port-forward para teste local)
```bash
# Zipkin UI
kubectl port-forward -n monitoring svc/zipkin 9411:9411
# Acesse: http://localhost:9411

# OpenTelemetry Collector
kubectl port-forward -n monitoring daemonset/otel-collector 4317:4317 4318:4318
# gRPC: localhost:4317
# HTTP: localhost:4318
```

### 3. Verificar logs
```bash
# Logs do Collector
kubectl logs -n monitoring -l app.kubernetes.io/name=opentelemetry-collector -f

# Logs do Zipkin
kubectl logs -n monitoring -l app.kubernetes.io/name=zipkin -f
```

### 4. Verificar métricas do Collector
```bash
# Port-forward para metrics
kubectl port-forward -n monitoring daemonset/otel-collector 8889:8889

# Visualizar:
curl http://localhost:8889/metrics | grep otel
```

## 🔌 Configuração da App

Para que sua NestJS app envie traces/metrics para o Collector:

### Variáveis de Ambiente
```bash
# gRPC (recomendado)
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc.cluster.local:4317

# HTTP (alternativa)
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc.cluster.local:4318

# Enable all signals
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

### Exemplo com @opentelemetry/api
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('nestjs-boilerplate-api');
const span = tracer.startSpan('my-operation');

// seu código aqui

span.end();
```

## 📊 Próximas Etapas

1. **Prometheus** (etapa 5): Coletar métricas do cluster e da app
2. **Grafana** (etapa 5): Visualizar dashboards
3. **Loki + Promtail** (etapa 5): Agregar e visualizar logs
4. **Alertmanager** (etapa 5): Gerenciar alertas

## ⚠️ Notas Importantes

### Zipkin
- Configurado para usar **Elasticsearch** como storage (remover `env` se usar storage em-memória)
- Se Elasticsearch não existir, usar `STORAGE_TYPE=mem` (não persiste entre restarts)
- Replica set: 2 (ajuste conforme sua infra)

### Collector
- Configurado como **DaemonSet** (roda em cada node)
- Ou mudar para **Deployment** se preferir centralizado
- Limite de memória: 512Mi (ajuste conforme volume de traces)

### Namespaces
- Collector e Zipkin: `monitoring`
- App principal: `nestjs-boilerplate-dev-workload`
- Service discovery: `otel-collector.monitoring.svc.cluster.local`

## 🐛 Troubleshooting

### Collector não consegue conectar a Zipkin
```bash
# Verificar se Zipkin está saudável
kubectl get svc -n monitoring zipkin
kubectl exec -it <collector-pod> -n monitoring -- curl http://zipkin:9411/health
```

### App não consegue conectar ao Collector
```bash
# Verificar DNS
kubectl run -it --rm debug --image=alpine --restart=Never -- nslookup otel-collector.monitoring.svc.cluster.local

# Verificar conectividade
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- curl http://otel-collector.monitoring.svc.cluster.local:4318/v1/status
```

### Sem traces aparecendo no Zipkin
- Verificar se app está instrumentada com OpenTelemetry
- Verificar variável `OTEL_EXPORTER_OTLP_ENDPOINT` na app
- Verificar logs do Collector para erros
