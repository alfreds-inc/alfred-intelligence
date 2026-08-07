# Zolven Intelligence — fork notes

This repository is Zolven's distribution of upstream
[`openclaw/openclaw`](https://github.com/openclaw/openclaw). The fork preserves
OpenClaw's upstream architecture and compatibility surfaces while presenting
the runtime as **Zolven Intelligence** throughout Zolven's product flow.

## Branch model

- **`zolven-brand`** is the GitHub default fork branch contract. It is
  bot-managed and force-pushed by
  `.github/workflows/zolven-rebase-and-publish.yml` after rebasing onto the
  latest upstream stable calver tag. The workflow job remains inert until
  GitHub reports `zolven-brand` as the selected ref: merge the rebrand first,
  then use GitHub's branch-rename operation on the current default branch.
  Do not create or delete the cutover branches manually.
- **`upstream-main`** is a one-to-one mirror of `openclaw/openclaw:main`. The
  same workflow updates it for tracking only.
- **`main`** is the historical fork-time mirror.
- Release tags (`vYYYY.M.D-zolven.N`) and promoted GitHub Releases are
  immutable records. Do not rely on the force-pushed fork branch tip remaining
  rewind-stable.

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
