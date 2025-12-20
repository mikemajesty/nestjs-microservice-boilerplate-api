# Deploy Guide

Welcome! This guide will walk you through the entire deployment process, from creating your first Pull Request to having your application running in production. Whether you're new to the project or just need a refresher, this document covers everything you need to know.

---

## Table of Contents

- [Getting Started](#getting-started)
- [The Pull Request Flow](#the-pull-request-flow)
- [Continuous Integration](#continuous-integration)
- [Creating a Release Tag](#creating-a-release-tag)
- [Deploying to an Environment](#deploying-to-an-environment)
- [Why We Use Tags](#why-we-use-tags)
- [Rollback Strategy](#rollback-strategy)
- [Best Practices](#best-practices)

---

## Getting Started

So you've cloned the project and want to deploy your changes. Great! Here's the journey your code will take:

```
Your Code → Pull Request → CI Validation → Merge → Tag → Deploy
```

Each step has a purpose, and together they ensure that only tested, reviewed, and versioned code reaches production.

---

## The Pull Request Flow

Every change starts with a **Pull Request (PR)**. When you open a PR targeting the `master` branch, two things happen automatically:

### 1. PR Title Validation

Your PR title must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. This isn't just a style preference — it's how we generate changelogs and track what changed between versions.

**Valid PR titles:**
- `feat: add user authentication`
- `fix: resolve database connection timeout`
- `docs: update API documentation`
- `chore: upgrade dependencies`

**Invalid PR titles:**
- `Added new feature` (missing type prefix)
- `Fix: resolve bug` (capital letter after colon)
- `WIP` (not descriptive)

If your PR title doesn't match the format, the validation will fail and you'll need to edit it before merging.

### 2. Commit Validation

Your commits are also checked to ensure they follow the same conventions. This keeps our git history clean and meaningful.

---

## Continuous Integration

Once your PR is open, our **CI pipeline** runs automatically. This is your safety net — it catches problems before they reach production.

### What CI Checks

**Linting**

The linter analyzes your code for potential issues, style violations, and common mistakes. It enforces consistent code style across the entire codebase, making it easier for everyone to read and maintain.

If the linter fails, check the error messages carefully. They usually point to the exact line and issue. Fix them locally, push your changes, and CI will run again.

**Tests with Coverage**

All tests run with coverage tracking. This ensures your changes don't break existing functionality and that new code is properly tested. We use [Testcontainers](https://testcontainers.com/) to spin up real databases during tests, so you can trust that tests reflect real-world behavior.

**Security Audit**

Dependencies are scanned for known vulnerabilities. While this check won't block your PR (it uses `continue-on-error`), you should review any warnings and address critical vulnerabilities when possible.

### Why This Matters

CI runs on every push to your PR. This means:
- You get immediate feedback on problems
- Reviewers know the code passes basic quality checks
- The `master` branch stays stable

---

## Creating a Release Tag

After your PR is merged, the next step is creating a **release tag**. This is done manually through GitHub Actions.

### How to Create a Tag

1. Go to **Actions** → **Create Release Tag**
2. Click **Run workflow**
3. Fill in the options:
   - **Source branch**: Usually `master`
   - **Increment type**: `patch`, `minor`, `major`, or `none`
   - **Merge from master**: Enable if working from a feature branch

### Choosing the Right Increment

| Type | When to Use | Example |
|------|-------------|---------|
| `patch` | Bug fixes, small improvements | `1.0.0` → `1.0.1` |
| `minor` | New features (backward compatible) | `1.0.0` → `1.1.0` |
| `major` | Breaking changes | `1.0.0` → `2.0.0` |
| `none` | Re-deploy without version change | `1.0.0` → `1.0.0` |

When the workflow completes, you'll have:
- An updated `package.json` with the new version
- A git tag (e.g., `v1.2.3`)
- A draft GitHub Release with auto-generated notes

---

## Deploying to an Environment

Now comes the exciting part — actually deploying your application!

### Environments Explained

We have three environments, each serving a different purpose:

**`dev` (Development)**

This is your playground. Deploy here frequently to test changes in a real environment. It's okay if things break — that's what dev is for.

**`preprod` (Pre-Production)**

A mirror of production. Use this to validate changes before they go live. Test integrations, run performance checks, and get final approval here.

**`prod` (Production)**

The real deal. This is what users interact with. Only deploy here after thorough testing in preprod.

### How Environments Work

When you select an environment during deploy, the workflow uses **environment-specific configurations**. This means:

- Different database connections
- Different API keys and secrets
- Different resource allocations
- Different logging levels

Each environment has its own set of secrets configured in GitHub. The same code behaves appropriately for each environment based on these configurations.

### Running the Deploy

1. Go to **Actions** → **Release**
2. Click **Run workflow**
3. Select your **environment** (dev, preprod, or prod)
4. Enter the **tag** you want to deploy (e.g., `v1.2.3`)
5. Click **Run workflow**

The workflow will:
- Validate the tag format
- Build the application
- Create a Docker image
- Push to DockerHub with appropriate tags
- Create a PR back to master (if deploying from a feature branch)

---

## Why We Use Tags

You might wonder: "Why can't I just deploy from a branch?" Great question!

### Tags Are Immutable

A branch is a moving target — it changes every time someone pushes. A tag, on the other hand, points to a specific commit forever. When you deploy `v1.2.3`, you know exactly what code is running.

### Tags Enable Easy Rollbacks

Something went wrong in production? No problem. Just deploy the previous tag:

```
Current: v1.2.3 (broken)
Rollback: v1.2.2 (stable)
```

You don't need to revert commits, create hotfix branches, or figure out "what was the last good state." The previous tag is right there, ready to deploy.

### Tags Create a Clear History

Looking at your tags tells the story of your releases:

```
v1.0.0 - Initial release
v1.0.1 - Bug fix for login
v1.1.0 - Added user profiles
v1.2.0 - Added notifications
v1.2.1 - Fixed notification sound
```

This makes it easy to track changes, write release notes, and communicate with stakeholders.

### Tag Format Validation

The release workflow only accepts tags in the format `vX.Y.Z` (e.g., `v1.0.0`, `v2.3.1`). This ensures consistency and prevents accidental deployments from arbitrary references.

---

## Rollback Strategy

Despite best efforts, sometimes deployments go wrong. Here's how to recover quickly:

### Quick Rollback Steps

1. **Identify the last stable version**
   - Check your recent tags: `git tag --sort=-creatordate | head -5`
   - Or look at GitHub Releases

2. **Deploy the previous tag**
   - Go to **Actions** → **Release**
   - Select the same environment
   - Enter the previous tag (e.g., `v1.2.2` instead of `v1.2.3`)

3. **Verify the rollback**
   - Check application health
   - Monitor logs for errors
   - Confirm the issue is resolved

### Why This Works

Because we deploy from tags, rolling back is just "deploying an older tag." The Docker image for that version already exists in the registry, so the rollback is fast.

---

## Best Practices

### Always Deploy Tags, Never Branches

Tags give you traceability, rollback capability, and a clear release history. Deploying from branches makes it hard to know what's actually running.

### Follow the Environment Progression

```
dev → preprod → prod
```

Don't skip environments. What works on your machine might fail in production due to different configurations, data, or scale.

### Use Meaningful Version Increments

- Fixed a typo? → `patch`
- Added a new API endpoint? → `minor`
- Changed authentication flow? → `major`

### Keep PRs Focused

Small, focused PRs are easier to review, test, and rollback if needed. A PR that changes 50 files is a red flag.

### Write Good PR Titles

Your PR title becomes part of the changelog. "Fix stuff" tells no one anything. "fix: resolve timeout in payment processing" tells the whole story.

### Test Before Production

Always deploy to `preprod` first and verify everything works. Production is not the place to discover bugs.

---

## Summary

Here's the complete flow one more time:

1. **Create a PR** with a conventional commit title
2. **CI validates** your code (lint, tests, security)
3. **Merge to master** after review approval
4. **Create a tag** with appropriate version increment
5. **Deploy to dev** and verify
6. **Deploy to preprod** and do final validation
7. **Deploy to prod** with confidence
8. **Rollback** if needed by deploying a previous tag

Each step builds confidence that your code is ready for users. Take your time, follow the process, and you'll have smooth deployments every time.

---

## Related Documentation

- [Action Workflows Explained](./action.md) - Detailed breakdown of each GitHub Action
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
