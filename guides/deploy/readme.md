# Deploy Guide

The deployment process publishes a versioned Docker image once, records its
immutable digest in a GitHub Release, then promotes that exact image to the
selected environment tags.

```text
PR checks → merge to master → create release tag → publish image/release
                                                   → promote dev/preprod/prod
```

For exact workflow behavior and troubleshooting, see the
[GitHub Actions deployment reference](./action.md).

## 1. Validate a pull request

Open a pull request targeting `master`. `validate-pr.yml` checks:

- PR title follows the configured Conventional Commit types and formatting.
- Commit messages follow the repository's commitlint rules.
- `npm run lint:check` and `npm test` pass.

After review and required checks, merge the PR. `ci.yml` runs lint and coverage
tests on pushes to `master`; its security audit runs on all configured events
but is non-blocking.

## 2. Create a release tag

After the intended code is on the source branch, use **Actions → Release
Pipeline → Run workflow** to perform the complete release. Or use **Create
Release Tag** if you only want to create and validate a tag before publishing
and promoting it separately.

Choose:

- **Source branch**: defaults to `master`.
- **Merge latest master**: defaults to enabled. For another source branch, the
  workflow merges `origin/master` into that branch and preserves its package
  version. Resolve conflicts on the source branch and retry.
- **Version increment**: `patch`, `minor`, `major`, or `none`.
- At least one promotion target: `dev`, `preprod`, and/or `prod` (required by
  the full pipeline).

The tag workflow installs dependencies and runs lint, tests, and build before
creating an annotated `vX.Y.Z` tag. It pushes the updated branch and tag
atomically. It does not open a PR for that branch update.

## 3. Publish the release

The full pipeline publishes automatically. For a separate run, use
**Actions → Publish Release** with a validated tag, such as `v1.2.3`.

The workflow verifies the tag format and that its commit is reachable from a
remote branch, then builds a multi-platform image for `linux/amd64` and
`linux/arm64`. It refuses to overwrite an existing versioned image tag and
publishes:

```text
mikelima1989/nestjs-microservice:<version>
```

It creates a published GitHub Release with generated release notes and an
`image-ref.txt` asset containing the immutable Docker image digest. It also
generates a changelog and attempts to open a PR against `master`.

## 4. Promote to environments

The full pipeline promotes automatically to the environments selected at
start. To promote separately, use **Actions → Promote Release**, enter the
published tag, and select one or more targets:

| Environment | DockerHub tag |
| --- | --- |
| `dev` | `mikelima1989/nestjs-microservice:dev` |
| `preprod` | `mikelima1989/nestjs-microservice:preprod` |
| `prod` | `mikelima1989/nestjs-microservice:prod` |

Promotion uses the digest from the GitHub Release; it does not rebuild the
image. Promotion jobs are ordered `dev` → `preprod` → `prod`; a failed
selected earlier job blocks later jobs. You may select a later environment
without selecting earlier ones. This workflow updates DockerHub tags; your
deployment platform must consume those tags to perform a cluster rollout.

Configure GitHub Environments named `dev`, `preprod`, and `prod` to use
protection rules and approvals. DockerHub credentials are repository Actions
secrets (`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`). Enable the repository
setting that allows GitHub Actions to create pull requests for automatic
changelog PR creation.

## Rollback

Run **Promote Release** with the last known-good published tag and select the
target environment. This moves the environment tag back to the digest recorded
by that release; it does not rebuild the old source. Verify the resulting
deployment in the environment after promotion.

## Important constraints

- Release tags use the strict `vMAJOR.MINOR.PATCH` format.
- Published GitHub Releases and versioned Docker image tags are not
  overwritten. Use a new version for a new release.
- Tags must point to a commit reachable from a remote branch.
- The full Release Pipeline requires at least one target environment before it
  begins creating a tag.
- Jest setup checks Docker availability, so Docker must be running for local
  tests.

See the [GitHub Actions deployment reference](./action.md) for workflow
triggers, permissions, full inputs, and troubleshooting.
