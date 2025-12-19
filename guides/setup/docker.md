<!-- @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/setup/docker.md -->

# Docker Reference

Docker reference guide for this project.

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build the image |
| `npm run docker:run` | Run the container |
| `npm run docker:stop` | Stop the container |
| `npm run docker:start` | Stop + Build + Run |

---

## Dockerfile

The Dockerfile uses **multi-stage build** for optimization:

### Stage 1: Build

```dockerfile
FROM node:22.12 AS build
```

- **Full image** (not Alpine): required for SWC which needs glibc
- **npm ci**: deterministic installation from `package-lock.json`
- **Compiles** TypeScript to JavaScript

### Stage 2: Production

```dockerfile
FROM node:22.12-alpine AS production
```

- **Alpine**: ~5x smaller image (~150MB vs ~800MB)
- **Non-root user**: security (doesn't run as root)
- **npm ci --omit=dev**: production dependencies only
- **Health check**: verifies the API is responding

### Best Practices Applied

| Practice | Benefit |
|----------|---------|
| Multi-stage build | Smaller final image, no devDependencies |
| Alpine for runtime | Reduces attack surface and size |
| Non-root user | Security (principle of least privilege) |
| COPY package*.json first | Better layer caching |
| npm ci | Reproducible builds |
| HEALTHCHECK | Orchestration knows if container is healthy |
| Labels | Metadata for identification |

---

## Docker Compose (Infrastructure)

The `docker-compose-infra.yml` manages all local infrastructure:

### Databases

| Service | Port | Description |
|---------|------|-------------|
| MongoDB (primary) | 27017 | Primary replica set node |
| MongoDB (secondary) | 27018 | Secondary node |
| MongoDB (tertiary) | 27019 | Tertiary node |
| PostgreSQL | 5432 | Relational database |
| Redis | 6379 | Cache and sessions |

### Observability

| Service | Port | Description |
|---------|------|-------------|
| Zipkin | 9411 | Distributed tracing |
| Prometheus | 9090 | Metrics |
| Grafana | 3000 | Dashboards |
| Loki | 3100 | Log aggregation |
| OpenTelemetry Collector | 4317/4318 | Telemetry collection |

### Admin UIs

| Service | Port | Description |
|---------|------|-------------|
| Mongo Express | 8081 | MongoDB UI |
| pgAdmin | 16543 | PostgreSQL UI |

### Commands

```bash
# Start all infrastructure (clears old volumes)
npm run setup

# Just start (without clearing)
docker-compose -f docker-compose-infra.yml up -d

# Stop everything
docker-compose -f docker-compose-infra.yml down

# View logs
docker-compose -f docker-compose-infra.yml logs -f
```

---

## Running the API in Container

### Prerequisites

1. Infrastructure running: `npm run setup`
2. Image built: `npm run docker:build`

### macOS/Windows

On macOS/Windows, Docker runs in a VM. For the container to access host services, use `host.docker.internal`:

```bash
docker run -p 5000:5000 --env-file .env \
  --add-host=host.docker.internal:host-gateway \
  -e MONGO_URL='mongodb://admin:admin123@host.docker.internal:27017/...' \
  -e POSTGRES_HOST=host.docker.internal \
  -e REDIS_URL='redis://:redis123@host.docker.internal:6379' \
  --name nestjs-api --rm nestjs-api
```

### Linux

On Linux, `--network host` works directly:

```bash
docker run -p 5000:5000 --env-file .env --network host --name nestjs-api --rm nestjs-api
```

---

## Related Files

- [Dockerfile](../../Dockerfile) - Image build
- [docker-compose-infra.yml](../../docker-compose-infra.yml) - Infrastructure
- [.dockerignore](../../.dockerignore) - Files ignored during build
