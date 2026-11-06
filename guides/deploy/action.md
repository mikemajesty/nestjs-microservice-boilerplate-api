# GitHub Actions: CI and Release

This guide documents the workflows in `.github/workflows/`. The release
process has three separate operations: create a validated tag, publish the
release artifact, and promote that artifact to one or more environments. The
manual **Release Pipeline** composes those operations.

## Workflows at a glance

| Workflow                 | Trigger                                                               | Purpose                                                                                                   |
| ------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ci.yml`                 | Push to `master`, pull request targeting `master`, or manual dispatch | Post-merge lint/tests and a non-blocking production dependency audit                                      |
| `validate-pr.yml`        | PR opened, edited, synchronized, or reopened                          | PR lint/tests, PR title validation, and commit message validation                                         |
| `create-release-tag.yml` | Manual dispatch or reusable workflow call                             | Optionally merge `master`, increment version, validate, and atomically push branch changes and a tag      |
| `release.yml`            | Manual dispatch or reusable workflow call                             | Validate a tag, build and publish a multi-platform Docker image, create a GitHub Release and changelog PR |
| `promote-release.yml`    | Manual dispatch or reusable workflow call                             | Promote the published immutable image to selected DockerHub environment tags                              |
| `release-pipeline.yml`   | Manual dispatch                                                       | Validate inputs, then create/tag, publish, and promote in sequence                                        |

All workflows use `ubuntu-26.04`. Workflows that run Node use `.nvmrc`.

## Pull request and CI checks

### `validate-pr.yml`

Runs for PR events `opened`, `edited`, `synchronize`, and `reopened`:

- **Validate Code** checks out the PR, sets up Node from `.nvmrc`, runs
  `npm ci`, `npm run lint:check`, and `npm test`.
- **Validate PR Title** checks the Conventional Commit type from
  `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`. A scope is optional; the subject must not start with an
  uppercase letter. A single-commit PR is not required.
- **Validate Commits** fetches full history and runs commitlint on commits
  between the PR base and head SHAs using Conventional Commit configuration.

### `ci.yml`

Triggers on push to `master`, PR targeting `master`, and manual dispatch.
Concurrency is grouped by workflow and ref; a newer run cancels an older run
in that group.

- **Lint** and **Test & Coverage** are skipped for `pull_request` events, since
  `validate-pr.yml` handles those checks for PRs.
- On pushes to `master` and manual dispatch, lint runs `npm run lint:check`,
  while tests run `npm run test:cov`. Coverage is uploaded to Codecov with
  `fail_ci_if_error: false`.
- **Security Audit** runs for all these event types and executes
  `npm audit --omit=dev --audit-level=high`; it is configured with
  `continue-on-error: true`, so the audit result does not fail the workflow.

`test/initialization.ts` checks that Docker is accessible for Jest runs; make
sure Docker is available when running tests locally or in CI.

## Create and push a release tag

`create-release-tag.yml` can be run directly from Actions or called by another
workflow.

### Inputs

| Input               | Meaning                                                         | Default for manual run |
| ------------------- | --------------------------------------------------------------- | ---------------------- |
| `branch_from`       | Existing remote branch to release                               | `master`               |
| `merge_from_master` | Merge the latest `origin/master` into the selected branch first | `true`                 |
| `increment_type`    | `patch`, `minor`, `major`, or `none`                            | `patch`                |

The workflow validates the branch name and confirms that the branch exists on
`origin`. If merging is enabled and the source is not `master`, it fetches and
merges `origin/master`. On conflicts it fails and requires conflicts to be
resolved on the source branch. During a successful merge it preserves the
selected branch's original `package.json` version across the merge.

Unless increment is `none`, it runs `npm version <increment> --no-git-tag-version`.
It checks that the resulting remote `v<version>` tag is unused, then runs:

```bash
npm ci
npm run lint:check
npm test
npm run build
```

If the worktree has changes, it commits the version files with
`chore(release): bump version to <version>`. It creates an annotated `v<version>`
tag and atomically pushes both the selected branch head and tag. This pushes
the updated branch directly; it does not open a PR.

The workflow has `contents: write` permission and serializes tag creation
through a shared concurrency group without cancelling an in-progress run.

## Publish a release and image

`release.yml` accepts a tag such as `v1.2.3`, either through manual dispatch
or a workflow call.

1. Validates the strict `vMAJOR.MINOR.PATCH` tag format.
2. Fetches tags and remote branches, resolves the tag to a commit, and rejects
   tags whose commit is not reachable from any remote branch.
3. Rejects a tag that already has a GitHub Release, because published releases
   are treated as immutable.
4. Checks out the validated commit SHA, not a moving branch name.
5. Logs into DockerHub and refuses to overwrite an existing versioned image
   tag.
6. Builds and pushes `mikelima1989/nestjs-microservice:<version>` for
   `linux/amd64` and `linux/arm64`, passing the repository `.nvmrc` value as
   the Docker build's `NODE_VERSION` argument. OCI labels include source,
   revision SHA, and version.
7. Writes the pushed image digest as
   `mikelima1989/nestjs-microservice@sha256:...` in `image-ref.txt` and
   attaches that file to a published GitHub Release with generated release
   notes. The workflow does not mark it draft or prerelease.
8. Generates a changelog and attempts to open a `docs(changelog)` PR against
   `master` from `changelog/<tag>`. If the changelog is unchanged, it skips PR
   creation.

The image is built once. Later promotions use the release's digest reference,
not a rebuild or a mutable version tag.

The workflow requires DockerHub credentials and `GITHUB_TOKEN` permissions
for repository contents and pull requests. Repository settings must allow
GitHub Actions to create pull requests for the changelog PR step.

## Promote a published image

`promote-release.yml` accepts a published tag and booleans for `dev`,
`preprod`, and `prod`. It requires at least one environment to be selected.
Before promotion it validates the tag and selection, downloads `image-ref.txt`
from the GitHub Release, and validates the immutable image reference.

Each selected job uses a GitHub Environment named `dev`, `preprod`, or `prod`,
authenticates to DockerHub, and creates/updates that environment tag from the
recorded digest:

```text
mikelima1989/nestjs-microservice:dev
mikelima1989/nestjs-microservice:preprod
mikelima1989/nestjs-microservice:prod
```

The jobs are ordered: preprod waits for validation and dev; prod waits for
validation, dev, and preprod. A failed selected earlier stage blocks later
stages. Earlier stages that were not selected are skipped and are allowed, so
the workflow does **not** require selecting dev before preprod or prod, nor
preprod before prod. Configure required reviewers on GitHub Environments if
approval is needed. The workflow changes DockerHub tags; it does not itself
apply Kubernetes manifests or trigger a cluster rollout.

## Run the full release pipeline

`release-pipeline.yml` is a manual orchestrator. Inputs:

- source branch, merge latest `master` (default enabled), and version increment
- booleans selecting `dev`, `preprod`, and/or `prod`

It first rejects a run with no selected environments. It then calls, in order:

```text
validate inputs
  → create-release-tag.yml
  → release.yml
  → promote-release.yml
```

The generated tag is passed automatically to publish and promotion. Secrets
are inherited by the called workflows. The pipeline has write permissions for
contents and pull requests. Environment approvals configured in GitHub remain
in effect.

You can also run each workflow independently: create a tag, publish that tag,
then promote the published release. `release.yml` and `promote-release.yml`
cannot be combined into one direct operation; promotion requires the release
asset containing the immutable digest reference.

## Configuration and permissions

### Repository Actions secrets

| Secret               | Used for                                                                             |
| -------------------- | ------------------------------------------------------------------------------------ |
| `DOCKERHUB_USERNAME` | DockerHub login in publish and promotion                                             |
| `DOCKERHUB_TOKEN`    | DockerHub login in publish and promotion                                             |
| `GITHUB_TOKEN`       | Automatically provided by GitHub; workflow permissions are declared in each workflow |

Also enable **Allow GitHub Actions to create and approve pull requests** in
repository Actions settings, or the changelog PR step may fail.

### GitHub Environments

Create GitHub Environments named exactly `dev`, `preprod`, and `prod` if those
promotion targets are used. Add required reviewers or other protection rules
there to gate a deployment. Each environment is attached to its promotion job.
The workflow does not use per-environment secrets; DockerHub credentials are
repository secrets.

## Troubleshooting

### PR validation

- Check the title type is one of the configured Conventional Commit types.
- Ensure the title subject does not start with an uppercase letter.
- Run `npm run lint:check` and `npm test` locally.
- Ensure commit messages between the PR base and head follow the repository's
  commitlint rules.

### Tag creation

- Confirm the source branch exists on `origin`.
- Resolve merge conflicts on that source branch, then rerun the workflow.
- Check whether `v<package.json version>` already exists remotely. Tags are
  not overwritten; choose an appropriate version increment.
- Ensure the selected source branch is writable by the workflow token and
  branch protection permits the workflow's push.
- If `npm ci`, lint, tests, or build fail, fix the candidate and rerun.

### Publishing

- Confirm the tag matches `vX.Y.Z`, points to a commit reachable from a remote
  branch, and has not already been published as a GitHub Release.
- Confirm the corresponding DockerHub version tag is unused and credentials
  are valid. Versioned images are not overwritten.
- If changelog PR creation fails, verify Actions is permitted to create PRs
  and that the token has the required permissions. The image and release may
  already have been published; inspect the run and GitHub Release before
  retrying, because published releases are immutable.

### Promotion

- Confirm the tag has a published GitHub Release with a valid `image-ref.txt`.
- Select at least one environment and configure its exact GitHub Environment
  name.
- Check DockerHub credentials and any required Environment approval.
- Review job dependencies: a failed selected earlier stage blocks later
  stages, but skipped earlier stages do not.

## Local commands

```bash
npm run lint:check
npm test
npm run test:cov
npm run build
```

To build the image locally:

```bash
docker build --build-arg NODE_VERSION="$(cat .nvmrc)" -t nestjs-api .
```

## Related documentation

- [Deploy overview](./README.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
