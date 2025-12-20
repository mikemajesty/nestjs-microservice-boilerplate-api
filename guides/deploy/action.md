# Deployment Guide

This guide explains the CI/CD pipeline, release workflow, and best practices for deploying the NestJS Microservice Boilerplate API.

---

## Table of Contents

- [Workflow Overview](#workflow-overview)
- [Release Flow Diagram](#release-flow-diagram)
- [Best Practices](#best-practices)
- [Workflow Steps Explained](#workflow-steps-explained)
  - [CI Workflow](#ci-workflow-ciyml)
  - [Validate PR Workflow](#validate-pr-workflow-validate-pryml)
  - [Create Release Tag Workflow](#create-release-tag-workflow-create-release-tagyml)
  - [Release Workflow](#release-workflow-releaseyml)
- [Secrets Configuration](#secrets-configuration)
- [Troubleshooting](#troubleshooting)

---

## Workflow Overview

The project uses **4 GitHub Actions workflows** that work together:

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI | `ci.yml` | Push/PR to master | Lint, test, security audit |
| Validate PR | `validate-pr.yml` | PR opened/edited | Enforce conventional commits |
| Create Release Tag | `create-release-tag.yml` | Manual | Create version tag with optional merge |
| Release | `release.yml` | Manual | Deploy to environment + Docker build |

### Execution Sequence

```
1. Developer creates PR
         │
         ▼
2. CI + Validate PR run automatically
         │
         ▼
3. PR merged to master
         │
         ▼
4. Developer triggers "Create Release Tag"
         │
         ▼
5. Developer triggers "Release" with tag + environment
         │
         ▼
6. Auto-PR created to merge back to master
```

---

## Release Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CREATE PR  │────►│   CI CHECKS  │────►│  MERGE TO    │────►│ CREATE TAG   │
│              │     │              │     │   MASTER     │     │              │
│  feature/*   │     │ • lint       │     │              │     │ • patch      │
│  hotfix/*    │     │ • test       │     │              │     │ • minor      │
│              │     │ • security   │     │              │     │ • major      │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
     ┌────────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RELEASE    │────►│    BUILD     │────►│    DOCKER    │────►│  AUTO PR TO  │
│   WORKFLOW   │     │              │     │              │     │    MASTER    │
│              │     │ • npm ci     │     │ • build      │     │              │
│ • env (dev/  │     │ • npm build  │     │ • push       │     │ 🚀 DEPLOYED! │
│   prod)      │     │              │     │ • tag        │     │              │
│ • tag        │     │              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Best Practices

### Branching Strategy

```
master (production-ready)
  │
  ├── feature/xyz
  │     └── PR → master
  │
  └── hotfix/abc
        └── PR → master
```

### Version Increment Guide

| Scenario | Increment | Example |
|----------|-----------|---------|
| Bug fixes | `patch` | `1.0.0` → `1.0.1` |
| New features | `minor` | `1.0.0` → `1.1.0` |
| Breaking changes | `major` | `1.0.0` → `2.0.0` |
| Re-deploy same version | `none` | `1.0.0` → `1.0.0` |

### Conventional Commits

Required for PR validation:

```bash
feat: add user authentication        # minor bump
fix: resolve database connection     # patch bump
docs: update API documentation       # no version impact
chore: update dependencies           # no version impact
BREAKING CHANGE: remove legacy API   # major bump
```

### Release Checklist

- [ ] All tests passing on master
- [ ] PR merged and validated
- [ ] Appropriate version increment selected
- [ ] Tag created successfully
- [ ] Correct environment selected for deploy
- [ ] Docker image pushed to registry
- [ ] PR to master created (if from feature branch)

---

## Workflow Steps Explained

### CI Workflow (`ci.yml`)

**Trigger:** Push or PR to master

**Jobs:**

#### Job 1: Lint

```yaml
- name: Run linter
  run: npm run lint
```

**Purpose:** Ensures code follows ESLint rules and coding standards.

---

#### Job 2: Test & Coverage

```yaml
- name: Run tests with coverage
  run: npm run test:cov

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
```

**Purpose:** 
- Runs test suite with Testcontainers
- Generates coverage report
- Uploads to Codecov for tracking

---

#### Job 3: Security Audit

```yaml
- name: Run security audit
  run: npm audit --audit-level=moderate
  continue-on-error: true
```

**Purpose:** Scans dependencies for known vulnerabilities.

---

### Validate PR Workflow (`validate-pr.yml`)

**Trigger:** PR opened, edited, or synchronized

#### Step 1: Validate PR Title

```yaml
- name: Validate PR title follows Conventional Commits
  uses: amannn/action-semantic-pull-request@v5
  with:
    types: |
      feat
      fix
      docs
      style
      refactor
      perf
      test
      build
      ci
      chore
      revert
```

**Purpose:** Enforces conventional commit format in PR titles for consistent changelog generation.

---

### Create Release Tag Workflow (`create-release-tag.yml`)

**Trigger:** Manual (`workflow_dispatch`)

**Inputs:**

| Input | Description | Options |
|-------|-------------|---------|
| `branch_from` | Source branch | Any branch (default: master) |
| `increment_type` | Version bump | patch, minor, major, none |
| `merge_from_master` | Sync with master | true/false |

#### Step 1: Smart Merge from Master

```yaml
- name: Smart Merge from Master
  if: ${{ github.event.inputs.merge_from_master == 'true' }}
  run: |
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    git merge origin/master --no-edit
    # Restore version after merge
    node -e "pkg.version = '$CURRENT_VERSION'; ..."
```

**Purpose:** Merges latest master changes while preserving branch version number.

---

#### Step 2: Increment Version

```yaml
- name: Increment Version
  if: ${{ github.event.inputs.increment_type != 'none' }}
  run: npm version ${{ github.event.inputs.increment_type }} --no-git-tag-version
```

**Purpose:** Bumps version in `package.json` using npm version command.

---

#### Step 3: Create Tag

```yaml
- name: Create Tag
  run: |
    VERSION=$(node -p "require('./package.json').version")
    TAG_NAME="v${VERSION}"
    git tag -a "$TAG_NAME" -m "Release ${TAG_NAME}"
```

**Purpose:** Creates annotated git tag with version number.

---

#### Step 4: Push Changes

```yaml
- name: Push Changes
  run: |
    git push origin HEAD:${{ github.event.inputs.branch_from }}
    git push origin ${{ steps.create_tag.outputs.tag_name }}
```

**Purpose:** Pushes version commit and tag to remote.

---

#### Step 5: Create Draft Release

```yaml
- name: Create GitHub Release
  uses: softprops/action-gh-release@v1
  with:
    tag_name: ${{ steps.create_tag.outputs.tag_name }}
    draft: true
    generate_release_notes: true
```

**Purpose:** Creates draft GitHub Release with auto-generated notes from commits.

---

### Release Workflow (`release.yml`)

**Trigger:** Manual (`workflow_dispatch`)

**Inputs:**

| Input | Description | Options |
|-------|-------------|---------|
| `environment` | Target environment | dev, preprod, prod |
| `tag` | Version tag | e.g., v1.2.3 |

#### Step 1: Validate Tag Format

```yaml
- name: Validate tag format
  run: |
    TAG="${{ github.event.inputs.tag }}"
    if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "❌ Error: Tag must be in format v1.0.0"
      exit 1
    fi
```

**Purpose:** Ensures tag follows semantic versioning format (v1.0.0).

---

#### Step 2: Build Application

```yaml
- name: Install dependencies
  run: npm ci

- name: Install SWC
  run: npm install @swc/cli @swc/core

- name: Build application
  run: npm run build
```

**Purpose:** 
- Clean install dependencies
- Install SWC compiler (required for build)
- Compile TypeScript to JavaScript

---

#### Step 3: Build & Push Docker Image

```yaml
- name: Build and Push Docker Image
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: |
      mikelima1989/nestjs-microservice:${{ steps.version.outputs.version }}
      mikelima1989/nestjs-microservice:${{ github.event.inputs.environment }}
    platforms: linux/amd64,linux/arm64
```

**Purpose:** 
- Builds multi-platform Docker image
- Tags with version number AND environment name
- Pushes to DockerHub

---

#### Step 4: Create PR to Master

```yaml
- name: Create PR to master
  if: steps.branch.outputs.branch != 'master'
  run: |
    gh pr create \
      --base master \
      --head "$BRANCH" \
      --title "🚀 Release $TAG to $ENV"
```

**Purpose:** Automatically creates PR to merge release changes back to master.

---

## Secrets Configuration

Configure these secrets in repository settings (Settings → Secrets → Actions):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `GITHUB_TOKEN` | Auto-provided | Automatic by GitHub |
| `DOCKERHUB_USERNAME` | DockerHub username | Your DockerHub account |
| `DOCKERHUB_TOKEN` | DockerHub access token | DockerHub → Account Settings → Security → New Access Token |

### Setting Up DockerHub Token

1. Go to [hub.docker.com](https://hub.docker.com/)
2. Account Settings → Security
3. New Access Token → Name: "GitHub Actions"
4. Copy token
5. Add to GitHub repo secrets as `DOCKERHUB_TOKEN`

---

## Troubleshooting

### Common Issues

#### CI Tests Failing

```bash
# Run tests locally with Testcontainers
npm run test:cov

# Ensure Docker is running
docker ps
```

#### PR Title Validation Failing

```bash
# Use conventional commit format
# ✅ feat: add new feature
# ✅ fix: resolve bug
# ❌ Added new feature
# ❌ Fix: Resolve bug (capital F)
```

#### Tag Already Exists

```bash
# Delete tag locally and remotely
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0
```

#### Docker Build Failing

```bash
# Test Docker build locally
docker build -t test .

# Check Dockerfile syntax
docker build --check .
```

#### Release PR Not Created

```bash
# Check if PR already exists
gh pr list --head feature-branch

# Manually create if needed
gh pr create --base master --head feature-branch
```

### Recovery Steps

1. **If tag creation fails after version bump:**
   - Revert package.json change
   - Re-run workflow

2. **If Docker push fails:**
   - Verify DockerHub credentials
   - Check repository exists
   - Re-run release workflow

3. **If PR creation fails:**
   - Check GITHUB_TOKEN permissions
   - Create PR manually via GitHub UI

---

## Quick Reference

```bash
# Local Development
npm run lint          # Run linter
npm run test:cov      # Run tests with coverage
npm run build         # Build application

# Release Process
1. Create/merge PR to master
2. Run "Create Release Tag" workflow
   - Select branch
   - Select increment type
   - Enable merge from master if needed
3. Run "Release" workflow
   - Select environment (dev → preprod → prod)
   - Enter tag (v1.2.3)
4. Verify deployment
5. Merge auto-created PR to master
```

---

## Related Documentation

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
