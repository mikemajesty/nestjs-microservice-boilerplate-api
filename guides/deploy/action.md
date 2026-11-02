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
  - [Publish Release Workflow](#publish-release-workflow-releaseyml)
  - [Promote Release Workflow](#promote-release-workflow-promote-releaseyml)
  - [Release Pipeline](#release-pipeline-release-pipelineyml)
- [Secrets Configuration](#secrets-configuration)
- [Troubleshooting](#troubleshooting)

---

## Workflow Overview

The project uses **6 GitHub Actions workflows** that work together:

| Workflow           | File                      | Trigger           | Purpose                                                 |
| ------------------ | ------------------------- | ----------------- | ------------------------------------------------------- |
| CI                 | `ci.yml`                  | Push/PR to master | Security audit and post-merge checks                    |
| Validate PR        | `validate-pr.yml`         | PR opened/edited  | Lint, test, title, and commit validation                |
| Create Release Tag | `create-release-tag.yml`  | Manual or reusable | Validate candidate, bump version, and create tag        |
| Publish Release    | `release.yml`             | Manual or reusable | Publish immutable image and create GitHub Release       |
| Promote Release    | `promote-release.yml`     | Manual or reusable | Promote one published image to selected environments    |
| Release Pipeline   | `release-pipeline.yml`    | Manual             | Orchestrate tag, publish, and environment promotion     |

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
4. Developer starts "Release Pipeline" (or runs workflows individually)
         │
         ▼
5. Pipeline validates inputs, optionally merges master, runs lint/test/build, and creates the tag
         │
         ▼
6. Pipeline publishes the image, GitHub Release, and changelog PR
         │
         ▼
7. Pipeline promotes the immutable image through selected environments, pausing for configured approvals
```

---

## Release Flow Diagram

```
PR + CHECKS
  lint/test
      │
      ▼
MERGE TO MASTER
      │
      ▼
CREATE RELEASE TAG
  lint/test/build
      │
      ▼
PUBLISH RELEASE
  build image once
  record image digest
      │
      ▼
PROMOTE RELEASE
  choose dev/preprod/prod
  promote aliases in order
```

The individual **Create Release Tag**, **Publish Release**, and **Promote
Release** workflows remain manually runnable. **Release Pipeline** composes
those same workflows and passes the generated tag forward automatically.
GitHub Environment protection rules pause the pipeline for approvals.

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

| Scenario               | Increment | Example           |
| ---------------------- | --------- | ----------------- |
| Bug fixes              | `patch`   | `1.0.0` → `1.0.1` |
| New features           | `minor`   | `1.0.0` → `1.1.0` |
| Breaking changes       | `major`   | `1.0.0` → `2.0.0` |
| Re-deploy same version | `none`    | `1.0.0` → `1.0.0` |

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
- [ ] Correct environments selected for promotion
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
  run: npm run lint:check
```

**Purpose:** Ensures code follows ESLint rules and coding standards.

---

#### Job 2: Test & Coverage

```yaml
- name: Run tests with coverage
  run: npm run test:cov

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v5
```

**Purpose:**

- Runs test suite with Testcontainers
- Generates coverage report
- Uploads to Codecov for tracking

---

#### Job 3: Security Audit

```yaml
- name: Run security audit
  run: npm audit  --omit=dev --audit-level=moderate
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

The workflow also runs `npm run lint:check` and `npm test` against the PR head.
Linting in CI is non-mutating; `npm run lint` remains available for local
autofixes.

---

### Create Release Tag Workflow (`create-release-tag.yml`)

**Trigger:** Manual (`workflow_dispatch`)

**Inputs:**

| Input               | Description                                      | Options / default          |
| ------------------- | ------------------------------------------------ | -------------------------- |
| `branch_from`       | Branch to create the release tag from            | Branch name; `master`      |
| `merge_from_master` | Merge latest `master` into that branch first     | Boolean; `true`            |
| `increment_type`    | Version bump                                      | patch, minor, major, none  |

The workflow uses the selected branch as the release source. By default, it
merges the latest `master` into that branch before validation, preserving the
selected branch's package version. If Git reports conflicts, the workflow stops
and requires resolving them on the source branch; it never chooses a side
automatically. Lint, tests, and build run against the merged candidate before
the version commit and annotated tag are pushed atomically to the branch.

#### Step 1: Increment Version

```yaml
- name: Increment Version
  if: ${{ github.event.inputs.increment_type != 'none' }}
  run: npm version ${{ github.event.inputs.increment_type }} --no-git-tag-version
```

**Purpose:** Bumps version in `package.json` using npm version command.

---

#### Step 2: Validate Release Candidate

```yaml
- name: Validate release candidate
  run: |
    npm ci
    npm run lint:check
    npm test
    npm run build
```

**Purpose:** Runs checks against the version-bumped source before creating or pushing a tag.

---

#### Step 3: Create and Push Tag

```yaml
- name: Push Changes
  run: |
    git push --atomic origin "HEAD:${BRANCH_NAME}" "refs/tags/${TAG_NAME}"
```

**Purpose:** Pushes the validated branch update and release tag together. The
publish workflow verifies that the tag commit is reachable from a remote branch.

---

### Publish Release Workflow (`release.yml`)

**Trigger:** Manual (`workflow_dispatch`) after the tag workflow succeeds.

**Input:** A release tag, such as `v1.2.3`.

The workflow confirms the tag commit is reachable from a remote branch, builds
and pushes one versioned multi-platform Docker image, and creates a GitHub Release. Lint and
tests run earlier in PR validation and again in `create-release-tag.yml`; they
are intentionally not repeated here. The full image digest is attached to the
GitHub Release as `image-ref.txt`, so later promotions use the exact published
artifact rather than rebuilding from a mutable tag.

The workflow also generates a changelog and opens a PR to `master`.

---

### Promote Release Workflow (`promote-release.yml`)

**Trigger:** Manual (`workflow_dispatch`).

**Inputs:** A published release tag and checkboxes for `dev`, `preprod`, and
`prod`. Select any one or more environments. The workflow rejects a request
with no environment selected.

Selected environments are promoted sequentially in the order `dev` → `preprod`
→ `prod`. A failed earlier selected stage blocks later stages. Configure GitHub
Environments under repository settings; use required reviewers for `prod` to
gate production promotion.

Promotion retags the image digest recorded in the GitHub Release; it does not
rebuild the image. The environment tags (`dev`, `preprod`, `prod`) remain
mutable pointers for existing consumers.

> This workflow updates DockerHub environment tags. It does not directly apply
> Kubernetes manifests; a deployment system must consume these tags for
> cluster rollout.

---

### Release Pipeline (`release-pipeline.yml`)

**Trigger:** Manual (`workflow_dispatch`).

Select the source branch, whether to merge the latest `master` (enabled by
default), version increment, and one or more target environments. The pipeline
calls the same reusable workflows available for independent manual runs:
create/validate tag → publish image and GitHub Release → promote selected
environments. It rejects a run with no environments selected before creating
the release tag. Approvals configured on GitHub Environments remain in effect.

---

## Secrets Configuration

Configure these secrets in repository settings (Settings → Secrets → Actions):

| Secret               | Description            | How to Get                                                 |
| -------------------- | ---------------------- | ---------------------------------------------------------- |
| `GITHUB_TOKEN`       | Auto-provided          | Automatic by GitHub                                        |
| `DOCKERHUB_USERNAME` | DockerHub username     | Your DockerHub account                                     |
| `DOCKERHUB_TOKEN`    | DockerHub access token | DockerHub → Account Settings → Security → New Access Token |

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
npm run lint          # Run linter with autofix
npm run lint:check    # Check lint without modifying files
npm run test:cov      # Run tests with coverage
npm run build         # Build application

# Release Process
1. Create/merge PR to master
2. Run "Release Pipeline" to perform the full flow, or run the individual workflows
   - Select source branch and increment type
   - Keep "Merge latest master" enabled (default)
3. Select one or more environments; approve protected environments when prompted
4. Merge the auto-created changelog PR
```

---

## Related Documentation

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
