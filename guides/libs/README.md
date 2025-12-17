# Libs Documentation

Shared libraries for cross-cutting concerns. Each lib provides centralized, reusable functionality used throughout the application.

| Lib | Purpose | Docs | Code |
|-----|---------|------|------|
| **Token** | JWT sign/verify for authentication | [token.md](./token.md) | [service.ts](../../src/libs/token/service.ts) |
| **Metrics** | OpenTelemetry metrics with Prometheus/Grafana | [metrics.md](./metrics.md) | [service.ts](../../src/libs/metrics/service.ts) |
| **i18n** | Multi-language internationalization | [i18n.md](./i18n.md) | [service.ts](../../src/libs/i18n/service.ts) |
| **Event** | Pub/sub event system | [event.md](./event.md) | [service.ts](../../src/libs/event/service.ts) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LIBS LAYER                              │
│  Cross-cutting concerns: auth, metrics, events, i18n           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│   │   Token     │  │   Metrics   │  │   Event     │           │
│   │   (JWT)     │  │ (OTel+Prom) │  │  (Pub/Sub)  │           │
│   └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
│   ┌─────────────┐                                              │
│   │    i18n     │                                              │
│   │  (Locales)  │                                              │
│   └─────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              Used by: Modules, Use Cases, Infra
```

Each lib follows the pattern:
- `adapter.ts` - Abstract interface (port)
- `service.ts` - Concrete implementation
- `module.ts` - NestJS module with DI setup
