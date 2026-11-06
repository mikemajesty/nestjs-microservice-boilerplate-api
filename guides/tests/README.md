# Test Utilities

Comprehensive testing tools that ensure **quality, reliability, and efficiency** in development. These utilities eliminate unnecessary complexity and provide consistent patterns for testing.

## 📋 **Available Utilities**

### Core Testing Tools
- **[TestUtils](util.md)** | [📄 Code](../../src/utils/test/utils.ts) - Typed mocks and validation assertions
- **[MockUtils and ZodMockSchema](mock.md)** | [📄 Code](../../src/utils/test/mock.ts) - Common test values and schema-based data generation
- **[Testcontainers](containers.md)** | [📄 Code](../../src/utils/test/e2e/containers.ts) - Real infrastructure testing with Docker containers
- **[Test Standards](standards.md)** - Canonical conventions for `core`, `modules`, infrastructure, utilities, and middleware

## 🎯 **Philosophy**

**Use the right test boundary**: Use typed mocks for isolated unit tests and real containers for integration tests whose behavior depends on MongoDB, PostgreSQL, or Redis.

**Type-aware test data**: Prefer `ZodMockSchema` for schema-shaped objects and use typed `TestUtils` mocks at dependency boundaries.

**Isolate state and release resources**: Tests should not depend on execution order and must close clients/connections as well as containers.

---

*Testing utilities that transform complexity into simplicity, ensuring confidence and speed in development.*