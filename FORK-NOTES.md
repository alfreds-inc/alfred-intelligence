# Alfred Intelligence — fork notes

This repo is an `alfreds-inc` distribution of upstream
[`openclaw/openclaw`](https://github.com/openclaw/openclaw) with a tiny branding
patch so the runtime identifies itself as "Alfred Intelligence" inside Alfred's
install flow.

## Branch model

- **`alfred-brand`** (default) — upstream stable tag + branding commits.
  Bot-managed: rebased and **force-pushed** by `.github/workflows/alfred-rebase-and-publish.yml`
  weekly against the latest upstream stable calver tag. Tags + published npm
  versions are the immutable record — do not rely on the branch tip being
  rewind-stable.
- **`upstream-main`** — 1:1 mirror of `openclaw/openclaw:main`. Fast-forwarded
  by the same workflow; never edited by hand.
- **`main`** — 1:1 mirror at fork time, left as a historical reference.

If you're on a local clone and the bot force-pushes while you're mid-edit,
`git pull --rebase` is the recovery path. Hotfixes land as a new branding
commit that the next rebase will naturally pick up.

## What we change versus upstream

1. `package.json` — rename to `@alfreds-inc/alfred-intelligence`, add
   `alfred-intelligence` and legacy `openclaw` bin entries, point repository
   metadata at this fork, set `publishConfig.access: "public"`.
2. `src/cli/cli-name.ts` — default CLI name is `alfred-intelligence`;
   `KNOWN_CLI_NAMES` still accepts `openclaw` for callers invoking under the
   legacy name.
3. `src/pairing/pairing-messages.ts` — "OpenClaw:" prefix → "Alfred Intelligence:".
4. `test/helpers/pairing-reply.ts`, `src/pairing/pairing-messages.test.ts`,
   `extensions/irc/src/inbound.behavior.test.ts` — assertions adjusted to match
   the new brand.

No logic or API changes. Everything else tracks upstream.

## Release cadence

The Monday workflow targets the latest upstream **stable** tag (calver
`vYYYY.M.D` with no prerelease suffix). Upstream's main frequently carries
`-beta.N` versions, so we pin to tags to keep stable-only republish.

Published versions follow `<upstream-stable>-alfred.<run-number>` and go to
npm's `staging` dist-tag. A human promotes to `latest` after smoke-testing.

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
