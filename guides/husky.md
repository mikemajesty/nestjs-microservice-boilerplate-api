# Git Hooks (Husky)

This project uses **Husky** to enforce code quality at every step of the git workflow. Git hooks run automatically and **cannot be bypassed** without explicit flags.

## Hook Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GIT WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   git add .                                                          │
│       │                                                              │
│       ▼                                                              │
│   git commit -m "feat(module): message"                              │
│       │                                                              │
│       ├──► [pre-commit] ─► lint-staged                               │
│       │         │                                                    │
│       │         ├──► eslint --fix                                    │
│       │         ├──► prettier --write                                │
│       │         └──► jest --findRelatedTests                         │
│       │                                                              │
│       ├──► [commit-msg] ─► commitlint                                │
│       │         │                                                    │
│       │         └──► Validates: type(scope): message                 │
│       │                                                              │
│       ▼                                                              │
│   git push                                                           │
│       │                                                              │
│       └──► [pre-push] ─► npm run test                                │
│                   │                                                  │
│                   ├──► npm run build                                 │
│                   │                                                  │
│                   └──► npm run make-badges                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Pre-Commit Hook

**File:** `.husky/pre-commit`

```bash
npx lint-staged

echo '\nI Know What You Did Last Commit\n'
```

### What Happens

When you run `git commit`, this hook executes **before** the commit is created.

**lint-staged** only processes **staged files** (not the entire codebase), making it fast.

### lint-staged Configuration

**File:** `.lintstagedrc.json`

```json
{
  "*.{ts,js}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{ts,js}": [
    "npm run test -- --findRelatedTests --passWithNoTests --bail"
  ]
}
```

### Actions Performed

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `eslint --fix` | Fix linting errors automatically |
| 2 | `prettier --write` | Format code to consistent style |
| 3 | `jest --findRelatedTests` | Run tests for changed files only |

### Flags Explained

- `--findRelatedTests`: Only runs tests that import the changed files
- `--passWithNoTests`: Doesn't fail if no tests exist for the file
- `--bail`: Stops at first test failure (fail fast)

### Example

```bash
# You modify: src/modules/cat/controller.ts
# lint-staged will:
# 1. ESLint fix controller.ts
# 2. Prettier format controller.ts
# 3. Run tests in src/modules/cat/__tests__/ that import controller.ts
```

---

## 2️⃣ Commit-Msg Hook

**File:** `.husky/commit-msg`

```bash
npx --no -- commitlint --edit $1
```

### What Happens

After pre-commit passes, this hook validates your **commit message format**.

### Conventional Commits Format

```
type(scope): message

Examples:
✅ feat(cat): add create endpoint
✅ fix(user): resolve password hash issue
❌ added new feature          (missing type and scope)
❌ feat: add feature          (missing scope)
❌ feat(cat) add feature      (missing colon)
```

### Allowed Types

From `@commitlint/config-conventional`:

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Other changes that don't modify src or test |
| `revert` | Reverts a previous commit |

### Allowed Scopes

**File:** [commitlint.config.js](../commitlint.config.js)

Scopes are **dynamically generated** by reading subdirectories from `src/`:

```javascript
// 1. Read top-level folders in src/
getDirectories('./src')  // → ['core', 'infra', 'libs', 'middlewares', 'modules', 'utils']

// 2. For each folder, read its subdirectories
./src/core/*       → cat, permission, reset-password, role, user
./src/infra/*      → cache, database, email, http, logger, repository, secrets
./src/libs/*       → event, i18n, metrics, token
./src/middlewares/* → filters, guards, interceptors, middlewares
./src/modules/*    → alert, cat, health, login, logout, permission, reset-password, role, user
./src/utils/*      → (files, not folders - not included)
```

**Plus hardcoded scopes** for common operations:

| Scope | Use Case |
|-------|----------|
| `remove` | Removing files/features |
| `revert` | Reverting commits |
| `conflict` | Merge conflict resolution |
| `config` | Configuration changes |
| `entity` | Entity modifications |
| `utils` | Utility functions |
| `deps` | Dependency updates |
| `modules` | Module-level changes |
| `test` | Test files |
| `migration` | Database migrations |
| `core` | Core layer changes |
| `swagger` | API documentation |
| `usecases` | Use case modifications |
| `ci` | CI/CD pipeline |
| `github` | GitHub workflows/configs |
| `workflow` | Workflow changes |
| `none` | No specific scope |
| `docs` | Documentation |

### Configuration Details

```javascript
/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/husky.md
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => message.includes('release')],
  rules: {
    'scope-empty': [2, 'never'],    // Scope is REQUIRED
    'scope-enum': [2, 'always', scopes]  // Must be from allowed list
  }
}
```

**Note:** Commits containing `release` in the message are ignored (for semantic-release).

---

## 3️⃣ Pre-Push Hook

**File:** `.husky/pre-push`

```bash
npm run test
npx npm run build
npm run make-badges
```

### What Happens

When you run `git push`, this hook executes **before** pushing to remote.

### Actions Performed

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `npm run test` | Run **ALL** tests (not just related) |
| 2 | `npm run build` | Verify TypeScript compiles without errors |
| 3 | `npm run make-badges` | Update coverage badges in README |

### Why Full Test Suite?

Pre-commit only runs **related tests** for speed. Pre-push runs **everything** to ensure:
- No regressions in unrelated code
- Integration tests pass
- The build is production-ready

### Time Expectation

This hook takes longer (1-3 minutes) because it:
- Runs all unit tests
- Runs all E2E tests with Testcontainers (spins up Docker)
- Compiles the entire project
- Generates coverage report

---

## Bypassing Hooks (Not Recommended)

### Skip Pre-Commit and Commit-Msg

```bash
git commit -m "message" --no-verify
# or
git commit -m "message" -n
```

### Skip Pre-Push

```bash
git push --no-verify
```

**⚠️ Warning:** Only bypass in emergencies. These hooks exist to prevent broken code from entering the repository.

---

## Troubleshooting

### Hook Not Running

```bash
# Reinstall husky
npm run prepare
```

### Permission Denied

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### Commit Message Rejected

```bash
# Check what went wrong
npx commitlint --from HEAD~1 --to HEAD --verbose

# Common fixes:
# - Add scope: feat: x → feat(module): x
# - Use valid type: added → feat
# - Use valid scope: feat(xyz) → feat(cat)
```

### Tests Failing on Push

```bash
# Run tests locally to see failures
npm run test

# Run with verbose output
npm run test -- --verbose
```

---

## Summary

| Hook | Trigger | Actions | Fail = Block |
|------|---------|---------|--------------|
| **pre-commit** | `git commit` | ESLint, Prettier, Related Tests | ✅ |
| **commit-msg** | `git commit` | Validate message format | ✅ |
| **pre-push** | `git push` | All Tests, Build, Badges | ✅ |

This workflow ensures:
- ✅ **Consistent code style** (ESLint + Prettier)
- ✅ **No broken tests** committed
- ✅ **Readable git history** (Conventional Commits)
- ✅ **Build always passes** before push
- ✅ **Coverage badges** always up-to-date
