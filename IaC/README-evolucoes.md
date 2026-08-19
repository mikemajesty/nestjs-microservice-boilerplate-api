# Evolucoes da infraestrutura

Este arquivo registra o plano de evolucao da infraestrutura da app.

## 1) Precisa pra app bootar

```text
Mongo / DocumentDB
Postgres / RDS
Redis / ElastiCache
```

```text
subnet group proprio para cada servico
security group proprio para cada servico
secret runtime com o contrato de env vars usado pela app
smoke app validando que os envs chegam corretos
```

## 2) Precisa pra observabilidade funcionar bem

```text
metrics-server
OpenTelemetry Collector
Zipkin
Prometheus
Grafana
Loki
Promtail
Alertmanager
```

```text
Collector recebe traces e metrics da app via OTLP
Collector exporta traces para Zipkin
Loki recebe logs da app
Prometheus coleta metrics do cluster e da app
Grafana visualiza tudo
Alertmanager recebe os alertas do Prometheus
```

## Ordem sugerida

```text
1. Subir os tres servicos base da app: Mongo, Postgres e Redis
2. Garantir que o secret runtime entregue os contratos MONGO_*, POSTGRES_* e REDIS_*
3. Subir metrics-server para habilitar HPA e kubectl top
4. Subir Collector e Zipkin
5. Subir Prometheus, Grafana, Loki, Promtail e Alertmanager
```