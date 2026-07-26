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
   `scripts/package-changelog.mjs` — version patterns accept the `-alfred.N`
   release suffix, resolving to the upstream base version's changelog section
   (without this, prepack aborts on fork release versions).
8. CI: adds `alfred-rebase-and-publish.yml`; trims providers/secrets in
   `openclaw-scheduled-live-checks.yml`; deletes `docker-release.yml`; skips
   the docs-translate dispatch for Alfred releases; gates the
   `installer_smoke` job in `install-smoke.yml` to the upstream repository.

   That last one is a **noise fix, not a bug fix**. The lane packs its
   baseline from npm (`${OPENCLAW_INSTALL_PACKAGE:-openclaw}@<version>`), but
   the fork ships from GitHub Releases and its scoped name is never published
   to npm, so the baseline silently falls back to upstream `openclaw` and the
   update-swap dies on `<stage>/lib/node_modules/openclaw`. No real install
   does that cross-package migration — production self-update derives the
   install spec from the installed package's own name, so fork installs update
   fork -> fork. Drop this gate once the swap reads the staged package's real
   name instead of assuming it equals the installed one (worth proposing
   upstream: it also unblocks a genuine openclaw -> fork migration).

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

## Scheduled workflows: what runs here, and what we turned off

The fork inherits upstream's entire CI fleet (~60 workflows). Most exist to
develop and release OpenClaw itself and cannot pass here — we ship from GitHub
Releases rather than npm, we carry a different CLI name, and we hold none of
upstream's provider secrets. Over 100 recent runs, exactly two scheduled
workflows were green.

Disabled **via the Actions API** (`gh workflow disable <id>`), deliberately not
by editing their YAML: an API-level disable adds zero fork surface, so the
weekly rebase has nothing extra to replay. The trade-off is that the state
lives in repo settings rather than in git — hence this list. Re-enable any of
them with `gh workflow enable <id>`.

| Workflow                                 | Why it is off                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw-scheduled-live-checks.yml`     | Live suites need Z.AI/OpenCode provider secrets the fork trims out, and its repo-E2E lane trips the documented CLI-name test failures. Structurally red, not transiently. |
| `qa-live-transports-convex.yml` (QA-Lab) | Never completed a run — queued for hours, then cancelled.                                                                                                                 |
| `openclaw-performance.yml`               | Same: queued, never completed.                                                                                                                                            |
| `stale.yml`                              | Same, and issue/PR triage is upstream's concern, not the fork's.                                                                                                          |
| `control-ui-locale-refresh.yml`          | Same.                                                                                                                                                                     |
| `codeql-android-critical-security.yml`   | Same (observed queued 22h+). The fork ships no Android app.                                                                                                               |
| `codeql-macos-critical-security.yml`     | Was already disabled before this cleanup.                                                                                                                                 |

Kept: `alfred-rebase-and-publish.yml` (the one that matters), `codeql.yml` and
`codeql-critical-quality.yml` (both consistently green and genuinely useful),
and `install-smoke.yml`, whose single broken lane is gated to upstream in
item 8 above rather than the whole workflow being switched off.

Beyond the noise, those never-completing workflows were **consuming runner
capacity**. Several sat queued for 22-24 hours at a time, and the 2026-07-25
release run hung for 2h22m in `Pack the npm tarball` before hitting the job
timeout — an identical re-run finished in 15 minutes once the queue cleared.
Turning them off is as much about making releases finish as about quieting the
inbox.

The rule to hold onto: **keep this repo's failure signals few and true.** A
permanently red check does not merely fail to inform, it conceals the checks
that do — which is exactly how a rebase-conflict issue sat unread for five days
while the fork drifted six weeks behind upstream.

## When a rebase conflicts

~~Repo issues are currently disabled, so the conflict-issue step downgrades to
a log warning~~ — **no longer true (corrected 2026-07-25)**. Issues are
enabled and the step works: the 2026-07-20 conflict against `v2026.7.1` duly
opened one, with the resolution commands in the body.

The alert firing is not the same as the alert being read. That issue sat
untouched for five days while the fork drifted six weeks behind upstream,
because `installer_smoke` had been failing every single day and had trained
everyone to ignore this repo's mail. That is why the lane is now gated to
upstream (item 8 above): a permanently red check does not merely fail to
inform, it conceals the checks that do. Keep this repo's failure signals
few and true.

Resolve locally:

```
git fetch upstream --tags
git checkout alfred-brand
git rebase --onto <latest-stable-tag> <previous-base-tag> alfred-brand
# fix conflicts, re-stage, git rebase --continue
git push --force-with-lease origin alfred-brand
```

Re-run the workflow via `workflow_dispatch` after pushing.
