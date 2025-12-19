<!-- @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/setup/environment.md -->

# Environment Variables Reference

Complete reference for all environment variables used in this project.

## Quick Setup

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

---

## Application

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP server port |
| `TIMEOUT` | `5000` | Request timeout in milliseconds |
| `NODE_ENV` | `local` | Environment: `local`, `dev`, `hml`, `prod` |
| `HOST` | `http://localhost:5000` | Application base URL |
| `WEBHOOK_HOST` | - | Your public IP for webhooks |
| `TZ` | `America/Sao_Paulo` | Timezone for date operations |
| `LOG_LEVEL` | `trace` | Log verbosity: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `DATE_FORMAT` | `dd/MM/yyyy HH:mm:ss` | Date format pattern (Luxon) |

---

## MongoDB

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_URL` | `mongodb://admin:admin123@127.0.0.1:27017/...` | Full connection string with replica set |
| `MONGO_DATABASE` | `nestjs_microservice` | Database name |
| `MONGO_ADMIN_PASSWORD` | `admin123` | Admin user password |

**Connection String Format:**
```
mongodb://user:password@host:port/database?authSource=admin&replicaSet=rs0&directConnection=true
```

---

## PostgreSQL

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |
| `POSTGRES_USER` | `admin` | Database user |
| `POSTGRES_PASSWORD` | `admin` | Database password |
| `POSTGRES_DATABASE` | `nestjs_microservice` | Database name |
| `POSTGRES_DB` | `nestjs_microservice` | Alias for database name (used by Docker) |
| `POSTGRES_INITDB_ARGS` | `--encoding=UTF-8...` | PostgreSQL initialization arguments |

---

## Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://:redis123@localhost:6379` | Full Redis connection URL |
| `REDIS_PASSWORD` | `redis123` | Redis password |

**URL Format:**
```
redis://:password@host:port
```

---

## Authentication

### JWT

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `MIGeMA0GCSq...` | Secret key for signing JWT tokens |
| `TOKEN_EXPIRATION` | `1h` | Access token expiration (e.g., `1h`, `30m`, `7d`) |
| `REFRESH_TOKEN_EXPIRATION` | `1d` | Refresh token expiration |

### Google OAuth

| Variable | Default | Description |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `http://localhost:5000/api/v1/login/google/callback` | OAuth callback URL |

---

## Email (SMTP)

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_HOST` | `smtp-mail.outlook.com` | SMTP server host |
| `EMAIL_PORT` | `587` | SMTP server port |
| `EMAIL_USER` | `admin@admin.com` | SMTP username |
| `EMAIL_PASS` | - | SMTP password |
| `EMAIL_FROM` | `admin@admin.com` | Default "from" address |

---

## Observability

### Tracing

| Variable | Default | Description |
|----------|---------|-------------|
| `ZIPKIN_URL` | `http://localhost:9411` | Zipkin server URL |
| `COLLECTOR_OTLP_ENABLED` | `true` | Enable OpenTelemetry collector |

### Metrics & Logs

| Variable | Default | Description |
|----------|---------|-------------|
| `PROMETHUES_URL` | `http://localhost:9090` | Prometheus server URL |
| `GRAFANA_URL` | `http://localhost:3000` | Grafana server URL |
| `GRAFANA_PASSWORD` | `grafana123` | Grafana admin password |
| `GF_SECURITY_ADMIN_PASSWORD` | `grafana123` | Grafana admin password (Docker) |
| `GF_INSTALL_PLUGINS` | `grafana-piechart-panel` | Grafana plugins to install |
| `LOKI_URL` | `http://localhost:3100` | Loki log aggregator URL |

---

## Admin UIs

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_EXPRESS_URL` | `http://localhost:4000` | Mongo Express URL |
| `PGADMIN_URL` | `http://localhost:16543` | pgAdmin URL |
| `PGADMIN_DEFAULT_EMAIL` | `pgadmin@gmail.com` | pgAdmin login email |
| `PGADMIN_DEFAULT_PASSWORD` | `PgAdmin2019!` | pgAdmin login password |

---

## System

| Variable | Default | Description |
|----------|---------|-------------|
| `UV_THREADPOOL_SIZE` | `8` | Node.js libuv thread pool size (for async I/O) |

---

## Load Testing (Artillery)

| Variable | Default | Description |
|----------|---------|-------------|
| `ARTILLERY_TARGET` | `http://localhost:5000` | Target URL for load tests |
| `ARTILLERY_ENV` | `local` | Artillery environment |
| `ARTILLERY_TEST_EMAIL` | `admin@admin.com` | Test user email |
| `ARTILLERY_TEST_PASSWORD` | `admin` | Test user password |

---

## Environment-Specific Values

### Local Development
```env
NODE_ENV=local
POSTGRES_HOST=localhost
MONGO_URL=mongodb://admin:admin123@127.0.0.1:27017/...
REDIS_URL=redis://:redis123@localhost:6379
```

### Docker Container (macOS/Windows)
```env
POSTGRES_HOST=host.docker.internal
MONGO_URL=mongodb://admin:admin123@host.docker.internal:27017/...
REDIS_URL=redis://:redis123@host.docker.internal:6379
```

### Production
```env
NODE_ENV=prod
LOG_LEVEL=info
# Use real credentials and hosts
```

---

## Related Files

- [.env](../../.env) - Environment file (not committed)
- [.env.example](../../.env.example) - Example template
- [Docker Reference](docker.md) - Container setup
