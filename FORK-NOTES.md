# Alfred Intelligence — fork notes

This repo is an `alfreds-inc` distribution of upstream
[`openclaw/openclaw`](https://github.com/openclaw/openclaw) with a tiny branding
patch so the runtime identifies itself as "Alfred Intelligence" inside Alfred's
install flow.

## Branch model

- **`alfred-brand`** (default) — upstream stable tag + branding commits.
  Bot-managed: rebased and **force-pushed** by `.github/workflows/alfred-rebase-and-publish.yml`
  weekly against the latest upstream stable calver tag. Release tags (signed
  or not, `vYYYY.M.D-alfred.N`) and the promoted GitHub Releases are the
  immutable record — don't rely on the branch tip being rewind-stable.
- **`upstream-main`** — 1:1 mirror of `openclaw/openclaw:main`. Fast-forwarded
  by the same workflow; never edited by hand.
- **`main`** — 1:1 mirror at fork time, left as a historical reference.

If you're on a local clone and the bot force-pushes while you're mid-edit,
`git pull --rebase` is the recovery path. Hotfixes land as a new branding
commit that the next rebase will naturally pick up.

## What we change versus upstream

1. `package.json` — name → `@alfreds-inc/alfred-intelligence`, `bin` maps both
   `alfred-intelligence` and legacy `openclaw` to `openclaw.mjs`, repository
   metadata points at this fork.
2. `src/cli/cli-name.ts` — default CLI name is `alfred-intelligence`;
   `KNOWN_CLI_NAMES` still accepts `openclaw` for callers invoking under the
   legacy name.
3. `src/pairing/pairing-messages.ts` — "OpenClaw:" prefix → "Alfred Intelligence:".
4. `scripts/openclaw-npm-release-check.ts` + matching test — widened identity
   assertions to accept both upstream and fork names/bins/repo URLs, so the
   fork's CI still runs the check clean.
5. `test/helpers/pairing-reply.ts`, `src/pairing/pairing-messages.test.ts`,
   `extensions/irc/src/inbound.behavior.test.ts` — assertions adjusted to match
   the new brand.

No runtime logic, API, or data-shape changes. Everything else tracks upstream.

## Release cadence and distribution

The Monday workflow targets the latest upstream **stable** tag (calver
`vYYYY.M.D` with no prerelease suffix). Upstream's `main` frequently carries
`-beta.N`, so we pin to tags to keep stable-only republish.

### No npm registry — GitHub Releases tarball

The fork is **not** published to the public npm registry. Instead, each
release attaches a pre-built tarball as a GitHub Release asset, with a fixed
filename so Alfred's installer can point at a stable URL:

```
https://github.com/alfreds-inc/alfred-intelligence/releases/latest/download/alfred-intelligence.tgz
```

`npm install -g <url>` works the same way as installing from the registry —
npm tracks the package identity from the tarball's internal `package.json`,
so `npm uninstall -g @alfreds-inc/alfred-intelligence` still cleans up
correctly.

### Prerelease → promote flow

New releases are created as **prereleases** (`gh release create --prerelease`).
GitHub excludes prereleases from `/releases/latest/`, so the
`releases/latest/download/alfred-intelligence.tgz` URL doesn't pick them up.

After smoke-testing the prerelease, promote it:

```
gh release edit vYYYY.M.D-alfred.N --prerelease=false --latest
```

That moves the `releases/latest` pointer. Alfred installs on any new machine
from that point consume the promoted tarball.

### Immutable releases

**Enable immutable releases in the repo settings** (Settings → Code security
→ Immutable releases). Without it, release assets can be re-uploaded under
the same tag, which defeats the purpose of pinning the installer at a fixed
URL. This is a one-time UI toggle; the REST API doesn't currently expose it.

Versions follow `<upstream-stable>-alfred.<run-number>`.

## When a rebase conflicts

The workflow opens a `rebase-conflict` issue with the exact commands to
resolve locally:

```
git fetch upstream --tags
git checkout alfred-brand
git rebase <latest-stable-tag>
# fix conflicts, re-stage, git rebase --continue
git push --force-with-lease origin alfred-brand
```

Re-run the workflow via `workflow_dispatch` after pushing.
