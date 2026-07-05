# Alfred Intelligence — fork notes

This repo is an `alfreds-inc` distribution of upstream
[`openclaw/openclaw`](https://github.com/openclaw/openclaw) with a branding
patch so the runtime identifies itself as "Alfred Intelligence" inside
Alfred's install flow.

## Branch model

- **`alfred-brand`** (default) — upstream stable tag + branding commit.
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

The whole branding delta is kept as **one consolidated replay commit**
(`brand: rebase Alfred Intelligence onto upstream vYYYY.M.D …`) so the weekly
rebase replays a single commit. Current surface (verified against
v2026.6.11):

1. `package.json` — name → `@alfreds-inc/alfred-intelligence`; `bin` maps
   both `alfred-intelligence` and legacy `openclaw` to `openclaw.mjs`;
   `homepage`/`bugs`/`repository` point at this fork. The `version` field
   stays at the upstream base — the `-alfred.N` bump is applied on the
   release tag only, so the next rebase never replays stale release commits.
2. `src/cli/cli-name.ts` — `DEFAULT_CLI_NAME` is `alfred-intelligence`;
   `KNOWN_CLI_NAMES` still accepts `openclaw` for callers invoking under the
   legacy name.
3. `src/cli/command-format.ts` — `CLI_PREFIX_RE`/`UPDATE_COMMAND_RE` accept
   both CLI names. Without this the CLI rename silently disables
   `--profile`/`--container` hint injection in `formatCliCommand`.
4. **Pairing: light rebrand only.** `src/pairing/pairing-messages.ts` keeps
   upstream's message structure and swaps the `OpenClaw:` prefix for
   `Alfred Intelligence:`; the approve command rebrands itself at render time
   via `formatCliCommand`/`resolveCliName`. Same for the approval message in
   `src/channels/plugins/pairing-message.ts`. Do **not** reintroduce
   structural rewrites of the pairing reply — the old "Hello, Alfred here"
   rewrite collided with upstream's pairing refactors and stalled the weekly
   rebase for two months (2026-05 → 2026-07).
5. Fork-owned test/helper updates matching the light rebrand:
   `src/pairing/pairing-messages.test.ts`,
   `src/plugin-sdk/test-helpers/pairing-reply.ts`,
   `extensions/whatsapp/src/monitor-inbox.test-harness.ts`,
   `extensions/irc/src/inbound.behavior.test.ts`.
6. One-line user-facing string rebrands in:
   `extensions/bonjour/src/advertiser.ts`, `src/agents/tool-display-exec.ts`,
   `src/infra/{backup-create,control-ui-assets,exec-approvals-effective,gateway-process-argv,openclaw-root,ports,push-apns}.ts`,
   `src/skills/loading/workspace.ts`.
7. `scripts/openclaw-npm-release-check.ts` + matching test — identity
   assertions widened to accept both upstream and fork names/bins/repo URLs.
8. CI: adds `alfred-rebase-and-publish.yml`; trims providers/secrets in
   `openclaw-scheduled-live-checks.yml`; deletes `docker-release.yml`; skips
   the docs-translate dispatch for Alfred releases.

No runtime logic, API, or data-shape changes beyond the CLI-name handling
described above.

## Known test failures under the fork brand

`resolveCliName()` defaults to `alfred-intelligence`, so upstream tests that
hardcode rendered CLI strings (e.g. `openclaw pairing approve …`) fail on the
fork — the runtime output is correct; the upstream expectation is the literal.
The release pipeline intentionally does **not** run vitest (its gates are
`tsgo:all` plus targeted lints), so these failures never block a release, but
you will see them in a local `pnpm test`.

Policy: leave upstream test files unpatched unless they are already
fork-owned (list in item 5 above). Known affected files as of v2026.6.11:
`src/flows/channel-setup.status.test.ts`,
`extensions/feishu/src/comment-handler.test.ts`,
`extensions/discord/src/monitor/monitor.agent-components.test.ts`,
`extensions/telegram/src/bot.create-telegram-bot.test.ts`.
(`src/channels/plugins/helpers.test.ts` contains the literal but passes — its
hint is fixture data, never rendered through `formatCliCommand`.)

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

### Direct publish (no prerelease gate)

Releases are created directly as the **latest normal release**
(`gh release create --latest`), so `releases/latest/download/…` picks them up
immediately — the earlier prerelease → promote flow was dropped in
`d45c01301b`. For a dry run (rebase + checks + pack, **no** release), trigger
the workflow manually with the `skip_release=true` input:

```
gh workflow run alfred-rebase-and-publish.yml -f skip_release=true
```

Versions follow `<upstream-stable>-alfred.<run-number>`.

### Immutable releases

**Enable immutable releases in the repo settings** (Settings → Code security
→ Immutable releases). Without it, release assets can be re-uploaded under
the same tag, which defeats the purpose of pinning the installer at a fixed
URL. This is a one-time UI toggle; the REST API doesn't currently expose it.

## When a rebase conflicts

⚠️ **Repo issues are currently disabled**, so the workflow's
"open a `rebase-conflict` issue" step downgrades to a log warning — the only
failure signal is the workflow-failure email. This is how the weekly rebase
sat broken for two months unnoticed. Either enable issues or check
[workflow runs](https://github.com/alfreds-inc/alfred-intelligence/actions/workflows/alfred-rebase-and-publish.yml)
when a Monday email arrives.

Resolve locally:

```
git fetch upstream --tags
git checkout alfred-brand
git rebase --onto <latest-stable-tag> <previous-base-tag> alfred-brand
# fix conflicts, re-stage, git rebase --continue
git push --force-with-lease origin alfred-brand
```

Re-run the workflow via `workflow_dispatch` after pushing.
