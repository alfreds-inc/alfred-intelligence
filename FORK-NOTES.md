# Zolven Intelligence — fork notes

This repository is Zolven's distribution of upstream
[`openclaw/openclaw`](https://github.com/openclaw/openclaw). The fork preserves
OpenClaw's upstream architecture and compatibility surfaces while presenting
the runtime as **Zolven Intelligence** throughout Zolven's product flow.

## Branch model

- **`main`** is the GitHub default branch and the fork's patch series. It is
  bot-managed and force-pushed by
  `.github/workflows/zolven-rebase-and-publish.yml` after rebasing onto the
  latest upstream stable calver tag.
  The force-push is structural, not incidental: the workflow resolves the next
  rebase base by reading `package.json` on this branch and checking
  `git merge-base --is-ancestor <base-tag> HEAD`. If the branch did not
  advance, the following run would replay from a stale base and re-apply
  commits it already applied. Do not redirect the push to a side branch.
- **`upstream-main`** is a one-to-one mirror of `openclaw/openclaw:main`. The
  same workflow updates it for tracking only.
- Release tags (`vYYYY.M.D-zolven.N`) and promoted GitHub Releases are
  immutable records. Do not rely on the force-pushed fork branch tip remaining
  rewind-stable.
- `archive/*` tags preserve retired fork lineages (the pre-rename `main`, the
  Alfred-era branch, and fork-owned feature branches) so the branch list can
  stay pruned without losing history.

If the bot force-pushes while a local edit is in progress, recover with
`git pull --rebase`. Hotfixes land as fork commits that the next rebase replays.

## What differs from upstream

Keep the product delta consolidated and easy to replay. The current surface,
verified against upstream `v2026.7.1`, is:

1. `package.json` keeps the upstream `openclaw` package identity. Renaming it
   broke packaging (`npm pack` emitted a name the packer's tarball matcher
   rejected), workspace resolution (32 extensions declare
   `"openclaw": "workspace:*"`), and update package-root detection
   (`DEFAULT_PACKAGE_NAME` is `openclaw`). Branding is a user-visible concern
   only — do not rename the package to brand the product.
   `zolven-intelligence` is the product binary; `openclaw` remains available as
   the upstream compatibility entrypoint. Repository metadata points to
   `Zolven/zolven-intelligence`.
2. `src/cli/cli-name.ts` defaults rendered commands to
   `zolven-intelligence`. CLI formatting recognizes both product and upstream
   entrypoints so upstream command templates render correctly.
3. Pairing and approval messages use **Zolven Intelligence** while preserving
   upstream message structure. Do not reintroduce whole-message rewrites;
   structural overrides have conflicted with upstream pairing refactors.
4. Product-facing diagnostics, Bonjour names, backup errors, APNs approval
   prompts, executable summaries, package-root discovery, Control UI discovery,
   and skill audit hints use the Zolven Intelligence identity.
5. `scripts/openclaw-npm-release-check.ts` validates both the upstream package
   and Zolven distribution contracts.
6. `scripts/package-changelog.mjs` accepts the `-zolven.N` release suffix and
   resolves it to the upstream base version's changelog section.
7. `scripts/check-openclaw-package-tarball.mjs` verifies that the shrinkwrap
   name matches the packed package name rather than hard-coding the upstream
   package identity.
8. CI adds `zolven-rebase-and-publish.yml`, skips documentation translation for
   Zolven release tags, and gates the upstream-only installer swap lane.

No upstream API, protocol, or data-shape contract is renamed.

## Tests

Fork-owned expectations follow the product identity. Tests that render CLI
commands should derive the active binary name rather than hard-code `openclaw`
or `zolven-intelligence`, unless the literal is the behavior under test.

Before release, validate the changed surface with the repository's standard
Crabbox/Testbox flow and run the mandatory pre-commit autoreview. Do not replace
remote broad validation with an unbounded local suite.

## Release cadence and distribution

The Monday workflow targets the latest upstream stable tag matching
`vYYYY.M.D`. Upstream prereleases and fork tags are deliberately excluded from
base-tag selection.

### GitHub Releases tarball

Zolven Intelligence is distributed as a pre-built GitHub Release tarball, not
from the public npm registry:

```text
https://github.com/Zolven/zolven-intelligence/releases/latest/download/zolven-intelligence.tgz
```

The tarball's internal package identity is `openclaw`, so removal is:

```sh
npm uninstall -g openclaw
```

Installs made from releases up to and including `v2026.7.1-zolven.2` carry the
older `@zolven/intelligence` identity. Those upgrade to a same-name install
rather than in place, so remove the old identity once:

```sh
npm uninstall -g @zolven/intelligence
```

Releases are created directly as the latest normal GitHub Release so
`releases/latest/download/...` resolves immediately. A dry run performs the
rebase, checks, and pack without creating a release:

```sh
gh workflow run zolven-rebase-and-publish.yml -f skip_release=true
```

Versions follow `<upstream-stable>-zolven.<run-number>`.

### Immutable releases

Enable immutable releases in repository settings. A fixed installer URL is
safe only when an existing tag and asset cannot be replaced.

### Docker distribution (not carried)

The fork distributes the GitHub Release tarball only. `docker-release.yml` and
`docker-channel-promote.yml` were dropped during the `v2026.7.1` rebase, so no
image is published to GHCR or Docker Hub.

`Dockerfile` itself is still carried and still covered by `src/dockerfile.test.ts`
— only upstream's _publishing_ assertions were removed, because they encode
upstream's registry contract (`openclaw/openclaw` image names, Docker Hub
credentials) rather than anything this fork owns.

This is reversible. To restore the lane:

```sh
git checkout upstream/main -- .github/workflows/docker-release.yml
git checkout upstream/main -- .github/workflows/docker-channel-promote.yml
git checkout upstream/main -- src/dockerfile.test.ts
```

Then set `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` and repoint the image names
away from `openclaw/openclaw`. Note the restored tests assert upstream's image
names verbatim, so they need the same repointing.

## Scheduled workflows

The fork inherits upstream workflows that may depend on upstream-only secrets,
products, or runner capacity. Disable unsuitable scheduled workflows through
the Actions API rather than carrying YAML deletions when possible; this keeps
the replayed fork surface small.

Keep:

- `zolven-rebase-and-publish.yml`
- `codeql.yml`
- `codeql-critical-quality.yml`
- `install-smoke.yml` with its upstream-only lane gated by repository

Known upstream-only or non-actionable scheduled lanes may remain disabled in
repository settings:

- `openclaw-scheduled-live-checks.yml`
- `qa-live-transports-convex.yml`
- `openclaw-performance.yml`
- `stale.yml`
- `control-ui-locale-refresh.yml`
- `codeql-android-critical-security.yml`
- `codeql-macos-critical-security.yml`

Keep failure signals few and actionable. A permanently red workflow hides real
release and rebase failures.

## Resolving a rebase conflict

The workflow opens a repository issue when its rebase fails. Resolve locally:

```sh
git fetch upstream --tags
git checkout <fork-branch>
git rebase --onto <latest-stable-tag> <previous-base-tag> <fork-branch>
# fix conflicts, re-stage, git rebase --continue
git push --force-with-lease origin <fork-branch>
```

Re-run `zolven-rebase-and-publish.yml` through `workflow_dispatch` after
pushing.
