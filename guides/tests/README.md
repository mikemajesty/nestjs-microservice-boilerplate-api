# Test Utilities

Comprehensive testing tools that ensure **quality, reliability, and efficiency** in development. These utilities eliminate unnecessary complexity and provide consistent patterns for testing.

## 📋 **Available Utilities**

### Core Testing Tools
- **[TestUtils](util.md)** | [📄 Code](../../src/utils/test/util.ts) - Type-safe utilities for mocking and validations
- **[ZodMockSchema](mock.md)** | [📄 Code](../../src/utils/test/mock.ts) - Automatic mock generation from Zod schemas
- **[Testcontainers](containers.md)** | [📄 Code](../../src/utils/test/containers.ts) - Real infrastructure testing with Docker containers

## 🎯 **Philosophy**

**Real Infrastructure over Mocks**: We prefer real containers (MongoDB, PostgreSQL, Redis) instead of complex mocks to ensure tests reflect production behavior.

**Type-Safe Testing**: All utilities are type-safe by design, eliminating runtime errors and improving developer experience.

**Automated Mock Generation**: Automatic test data generation from existing schemas, maintaining consistency and reducing manual maintenance.

---

*Testing utilities that transform complexity into simplicity, ensuring confidence and speed in development.*