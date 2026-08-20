# Transição: Smoke App → Boilerplate App

## 📋 O que foi feito

### ✅ Removido

- `gitops/argocd/applications/app.yaml` (ArgoCD Application)
- `gitops/apps/app/` ainda existe pra referência, mas não é mais deployado

### ✅ Criado

- `gitops/apps/boilerplate-app/` (cópia adaptada do app)
- `gitops/argocd/applications/boilerplate-app.yaml` (nova ArgoCD Application)

## 🔄 Mudanças Principais

| Smoke App                          | Boilerplate App                          |
| ---------------------------------- | ---------------------------------------- |
| `APP_MAIN: main`                   | `APP_MAIN: main`                         |
| Name: `nestjs-boilerplate-dev-app` | Name: `nestjs-boilerplate-dev-app`       |
| Entry point: `/src/main.ts`        | Entry point: `/src/main.ts`              |
| Health: `/health`                  | Health: `/health/ready` e `/health/live` |
| Sync-wave: 10                      | Sync-wave: 30 (depois de monitoring)     |

## 🚀 O que Acontece Agora

1. **ArgoCD detecta** que `app.yaml` foi deletado
2. **ArgoCD deleta** o deployment do app no cluster
3. **ArgoCD detecta** que `boilerplate-app.yaml` foi criado
4. **ArgoCD cria** o deployment da boilerplate-app com:
   - Mesma namespace: `nestjs-boilerplate-dev-workload`
   - Mesmas envs do ConfigMap (com Zipkin, Prometheus, etc)
   - Mesmo Secret runtime (banco de dados, etc)
   - 2 replicas com tolerations e nodeSelector
   - HPA, service, http-route, etc

## ✨ Vantagens

- ✅ Mesma estrutura que app (validada)
- ✅ Herda todas as envs de observabilidade
- ✅ Pronto pra conectar em Mongo, Postgres, Redis
- ✅ Pronto pra enviar traces ao Collector/Zipkin
- ✅ Logs serão enviados ao Loki (quando criado)
- ✅ Métricas serão coletadas pelo Prometheus (quando criado)

## 🎯 Próximas Etapas

1. **Sync via ArgoCD**:

   ```bash
   argocd app sync boilerplate-app
   ```

2. **Validar**:

   ```bash
   kubectl logs -n nestjs-boilerplate-dev-workload -l app.kubernetes.io/name=nestjs-boilerplate-dev-app -f
   ```

3. **Verificar se conectou** (procure no log):
   - ✅ `🔵 Postgres listening at ...`
   - ✅ `🔵 Mongo listening at ...`
   - ✅ `⚪ Zipkin[Tracing] listening at ...`
   - ✅ `⚪ Promethues[Metrics] listening at ...`
   - ✅ `🟢 nestjs-boilerplate listening at 5000 ...`

4. **Depois**: Criar Prometheus + Grafana + Loki na Etapa 5

## 📝 Arquivos

```
gitops/
├── argocd/applications/
│   ├── boilerplate-app.yaml          ← Nova (cria app real)
│   └── app.yaml                ← Deletado
├── apps/
│   ├── app/                    ← Mantém-se (pra referência)
│   └── boilerplate-app/              ← Nova (cópia adaptada)
│       ├── namespace.yaml
│       ├── config-map.yaml           (APP_MAIN: main)
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── external-secret.yaml
│       ├── service-account.yaml
│       ├── role.yaml
│       ├── role-binding.yaml
│       ├── horizontal-pod-autoscaler.yaml
│       ├── pod-disruption-budget.yaml
│       ├── http-route.yaml
│       └── kustomization.yaml
```

## 🔐 Segredos Esperados

O `external-secret.yaml` espera que exista um Secret no AWS Secrets Manager chamado:

- `nestjs-boilerplate-dev-app-runtime`

Com as mesmas chaves que o smoke tinha:

- `MONGO_URL`
- `POSTGRES_URL`
- `REDIS_URL`
- Etc...

Se não existir, o deployment falhará. Verifique:

```bash
kubectl get secret -n nestjs-boilerplate-dev-workload
```

Se faltar, copie do smoke:

```bash
kubectl get secret nestjs-boilerplate-dev-app-runtime -o yaml | \
  sed 's/app/app/g' | \
  kubectl apply -f -
```
