# Mapeamento de Environment Variables: Local vs Kubernetes

## 📋 Resumo

Este documento mapeia as environment variables definidas no `.env` local com suas contrapartes no Kubernetes, garantindo que o container tenha as mesmas variáveis com os mesmos nomes.

---

## 🔄 Mapeamento: Local → Kubernetes

### OpenTelemetry / Observability

| Local (.env) | Kubernetes (ConfigMap) | Endereço Real | Descrição |
|---|---|---|---|
| `ZIPKIN_URL=http://localhost:9411` | `ZIPKIN_URL=http://zipkin.monitoring.svc.cluster.local:9411` | Zipkin service no ns `monitoring` | Trace visualization |
| `PROMETHUES_URL=http://localhost:9090` | `PROMETHUES_URL=http://prometheus.monitoring.svc.cluster.local:9090` | Prometheus no ns `monitoring` | Metrics (typo mantido pra compat) |
| `PROMETHEUS_URL` (não existe local) | `PROMETHEUS_URL=http://prometheus.monitoring.svc.cluster.local:9090` | Prometheus no ns `monitoring` | Metrics (variável adicional) |
| `COLLECTOR_OTLP_ENABLED=true` | `COLLECTOR_OTLP_ENABLED=true` | - | Habilita OTLP |
| (não existe local) | `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc.cluster.local:4317` | Collector no ns `monitoring` | Endpoint OTLP gRPC |
| (não existe local) | `OTEL_EXPORTER_OTLP_PROTOCOL=grpc` | - | Protocol OTLP |
| `GRAFANA_URL=http://localhost:3000` | `GRAFANA_URL=http://grafana.monitoring.svc.cluster.local:3000` | Grafana no ns `monitoring` | Dashboards |
| `LOKI_URL=http://localhost:3100` | `LOKI_URL=http://loki.monitoring.svc.cluster.local:3100` | Loki no ns `monitoring` | Log aggregation |

### Database / Infrastructure (já mapeado)

| Componente | Local | Kubernetes | Namespace |
|---|---|---|---|
| Mongo | `mongodb://localhost:27017` | `mongodb.app.svc.cluster.local:27017` | `default` |
| PostgreSQL | `localhost:5432` | `postgres.app.svc.cluster.local:5432` | `default` |
| Redis | `redis://localhost:6379` | `redis.app.svc.cluster.local:6379` | `default` |

---

## 📍 Onde as Envs são Definidas

### Smoke App (Validação)

**Arquivo**: `gitops/apps/smoke-app/config-map.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nestjs-boilerplate-dev-smoke-app
  namespace: nestjs-boilerplate-dev-workload
data:
  # Todas as envs de observabilidade
  ZIPKIN_URL: 'http://zipkin.monitoring.svc.cluster.local:9411'
  # ... (ver arquivo completo)
```

**Como injetar no container**:
```yaml
containers:
  - name: smoke-app
    envFrom:
      - configMapRef:
          name: nestjs-boilerplate-dev-smoke-app  # Injeta todas as keys como envs
      - secretRef:
          name: nestjs-boilerplate-dev-smoke-app-runtime  # Injeta segredos
```

### Observability ConfigMap (Compartilhado)

**Arquivo**: `gitops/argocd/applications/observability-configmap.yaml`

Defines as mesmas envs para serem reutilizadas em outras apps:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: observability-config
  namespace: monitoring
data:
  ZIPKIN_URL: 'http://zipkin.monitoring.svc.cluster.local:9411'
  # ... (ver arquivo completo)
```

---

## 🎯 Como Usar em Outra App

Quando você remover o smoke app e plugar a app real, faça:

### Opção A: Referenciar o ConfigMap da Observabilidade
```yaml
containers:
  - name: my-app
    envFrom:
      - configMapRef:
          name: app-config  # Config específica da app
      - configMapRef:
          name: observability-config  # ConfigMap compartilhado
          namespace: monitoring
      - secretRef:
          name: app-runtime-secret
```

### Opção B: Copiar as Envs pro ConfigMap da App
Copiando os dados do `observability-configmap.yaml` pra seu próprio ConfigMap da app.

---

## ✅ Validação: Smoke App

O smoke app foi atualizado (`src/main-smoke.ts`) para validar as envs de observabilidade.

Endpoint: `GET /health`

Resposta esperada:
```json
{
  "status": "ok",
  "env": {
    "ZIPKIN_URL": "http://zipkin.monitoring.svc.cluster.local:9411",
    "PROMETHEUS_URL": "http://prometheus.monitoring.svc.cluster.local:9090",
    "COLLECTOR_OTLP_ENABLED": "true",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://otel-collector.monitoring.svc.cluster.local:4317",
    "GRAFANA_URL": "http://grafana.monitoring.svc.cluster.local:3000",
    "LOKI_URL": "http://loki.monitoring.svc.cluster.local:3100"
  }
}
```

### Testar Localmente

```bash
# Iniciar smoke app localmente
npm run build
PORT=5000 npm run start:smoke

# Em outro terminal
curl http://localhost:5000/health | jq .env
```

### Testar no Kubernetes

```bash
# Port-forward pro smoke app
kubectl port-forward -n nestjs-boilerplate-dev-workload svc/nestjs-boilerplate-dev-smoke-app 5000:5000

# Chamar
curl http://localhost:5000/health | jq .env

# Ou diretamente no pod
kubectl exec -it <pod-name> -n nestjs-boilerplate-dev-workload -- \
  env | grep -E "ZIPKIN|PROMETHEUS|COLLECTOR|GRAFANA|LOKI"
```

---

## 🚀 DNS Resolution: Como Funciona

No Kubernetes, os serviços são acessíveis via DNS:

```
<service-name>.<namespace>.svc.cluster.local:<port>
```

Exemplos:
- `zipkin.monitoring.svc.cluster.local` - Zipkin no namespace `monitoring`
- `otel-collector.monitoring.svc.cluster.local` - Collector no namespace `monitoring`
- `prometheus.monitoring.svc.cluster.local` - Prometheus no namespace `monitoring`

Isso só funciona se:
1. Os pods estão no mesmo cluster
2. A rede do cluster permite DNS (sempre habilitado no EKS)
3. O serviço existe e está healthy

---

## 🐛 Troubleshooting

### "Cannot resolve DNS"
```bash
# Testar resolução dentro do pod
kubectl exec -it <pod-name> -- nslookup otel-collector.monitoring.svc.cluster.local

# Ou usar busybox
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup otel-collector.monitoring.svc.cluster.local
```

### "Connection refused"
```bash
# Verificar se o serviço existe
kubectl get svc -n monitoring

# Verificar se o pod existe e está rodando
kubectl get pods -n monitoring

# Port-forward pra testar
kubectl port-forward -n monitoring svc/zipkin 9411:9411
curl http://localhost:9411
```

### Env não aparece no pod
```bash
# Verificar ConfigMap
kubectl get configmap nestjs-boilerplate-dev-smoke-app -o yaml

# Verificar Secret
kubectl get secret nestjs-boilerplate-dev-smoke-app-runtime -o yaml

# Rebuild do pod
kubectl delete pod <pod-name> -n nestjs-boilerplate-dev-workload
```

---

## 📝 Checklist: Próximas Etapas

- [x] Definir envs locais no `.env`
- [x] Atualizar `main-smoke.ts` pra validar observabilidade
- [x] Criar ConfigMap com envs no K8s
- [x] Configurar deployment pra injetar envs
- [x] Documentar mapeamento
- [ ] Deploy do Collector + Zipkin
- [ ] Testar smoke app no K8s
- [ ] Deploy da app principal com observabilidade
- [ ] Deploy do Prometheus + Grafana + Loki
