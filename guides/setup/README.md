# Setup

> **Note:** The `setup` folder contains all documentation related to **project setup and configuration** — environment variables, npm scripts, Docker, Git hooks, and application bootstrap.

## Overview

```
guides/setup/
├── main.md          # Application bootstrap and security
├── environment.md   # Environment variables reference
├── package.md       # npm scripts reference
├── docker.md        # Container and infrastructure setup
└── husky.md         # Git hooks configuration
```

## Guides

| Guide | Implementation | Description |
|-------|----------------|-------------|
| [Main](./main.md) | [main.ts](../../src/main.ts) | Application bootstrap, security headers, error handling |
| [Environment](./environment.md) | [.env](../../.env) | All environment variables with descriptions |
| [Package](./package.md) | [package.json](../../package.json) | npm scripts for dev, test, build, docker |
| [Docker](./docker.md) | [Dockerfile](../../Dockerfile), [docker-compose-infra.yml](../../docker-compose-infra.yml) | Multi-stage build, infrastructure services |
| [Husky](./husky.md) | [.husky/](../../.husky/) | Pre-commit, commit-msg, pre-push hooks |

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env

# 2. Start infrastructure (MongoDB, PostgreSQL, Redis, etc.)
npm run setup

# 3. Run in development mode
npm run start:dev

# 4. Access the API
open http://localhost:5000/api-docs
```

## Related

- [Infra](../infra/README.md) - Infrastructure services (database, cache, etc.)
- [Modules](../modules/README.md) - Application modules
- [Core](../core/README.md) - Business logic layer
