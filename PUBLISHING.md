# Publishing Runbook

This documents the full workflow for publishing a new blog post and sending the
weekly newsletter for this repo. It exists so a fresh machine or a fresh Claude
Code session can pick this up without re-deriving it from scratch.

## Architecture overview

- **Blog**: an Astro site deployed to Cloudflare Workers (project name
  `aimyselfandi`), with content in `src/content/blog/*.md`. Deploys
  automatically via Cloudflare's Git integration whenever `main` is pushed —
  no manual deploy step for the blog itself.
- **Newsletter**: a separate Cloudflare Worker in `newsletter-worker/`
  (project name `aimyselfandi-newsletter`). It is **not** on Cloudflare's Git
  auto-deploy — it must be deployed manually with `wrangler deploy` whenever
  its code changes.
- **Subscribers**: stored in a D1 database (`subscribers-db`), shared by both
  the main site (`/api/subscribe`, `/api/unsubscribe`) and the newsletter
  worker.

## One-time local setup (needed on any new machine/session)

```
npm install                       # repo root — Astro site deps
cd newsletter-worker && npm install   # newsletter worker deps (wrangler, etc.)
```

Hero images are sometimes supplied as `.webp` and need converting to `.jpg`
to match the existing convention (`public/blog/<slug>.jpg`). This sandbox's
system Python has a broken Pillow install under `/usr/lib/python3/dist-packages`
— use the separately-installed `python3.13` instead (or `pip install Pillow`
if it's missing) for conversions like:

```python
from PIL import Image
Image.open('/path/to/image.webp').convert('RGB').save('public/blog/<slug>.jpg', 'JPEG', quality=92)
```

## Publishing a new blog post

1. Get title + body text, and a hero image (user provides one, or it's
   generated, or skipped — `heroImage` is optional in the content schema).
2. Pick a slug (kebab-case, reasonably short — doesn't have to be the full
   title; confirm with the user or pick something sensible).
3. Write `src/content/blog/<slug>.md` with frontmatter:
   ```yaml
   ---
   title: "..."
   description: "..."   # also used as the newsletter subject/preview text
   pubDate: "Mon DD YYYY"
   heroImage: "/blog/<slug>.jpg"   # omit if none
   ---
   ```
4. Save the hero image to `public/blog/<slug>.jpg` (converting from webp if
   needed, per above).
5. Verify before pushing:
   ```
   npm run build
   cat dist/api/latest-post.json   # confirm it picks up the new post
   ```
6. Commit, push to the designated branch
   (`claude/blog-newsletter-publishing-d6sbd0`), open a PR against `main`,
   wait for the `Workers Builds: aimyselfandi` check to go green, then merge.
   The site deploys automatically from there.

If the branch's prior PR was already merged, just keep pushing new commits to
the same branch name and open a **new** PR each time (GitHub won't reopen a
closed/merged one).

## How the newsletter actually gets sent

The newsletter worker (`newsletter-worker/src/index.ts`) has no hardcoded
article data. At send time it:

1. Fetches `https://blog.cedricanne.com/api/latest-post.json` (a static
   endpoint generated at build time from the blog content collection —
   `src/pages/api/latest-post.json.ts`) to get the newest post's title,
   description, URL, and hero image.
2. Checks the `newsletter_sent` table in D1 (keyed by article URL) to see if
   that post was already sent — if so, it skips (so the Monday cron can't
   accidentally resend an old post).
3. Sends to every row in the `subscribers` table via the Resend API, then
   records the send and emails a delivery summary to the site owner.

This means **publishing a post is the only step required** — nothing else
needs to be touched for the newsletter to go out.

### Triggers

- **Automatic**: a Cloudflare Cron Trigger fires every Monday at 8am EST
  (`0 13 * * 1` UTC) and calls the same send logic.
- **Manual, no terminal needed**: GitHub Actions → "Send Newsletter" →
  "Run workflow" (optionally check "force" to resend a post already marked
  sent). This is `.github/workflows/send-newsletter.yml`, a `workflow_dispatch`
  job that POSTs to the deployed worker.
- **Manual, via terminal**:
  ```
  curl -X POST https://<newsletter-worker-url> -H "Authorization: Bearer <TRIGGER_SECRET>"
  ```

## Required secrets

**On the Cloudflare Worker** (`newsletter-worker/`, set via
`npx wrangler secret put <NAME>` from that directory):

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Used to call Resend's API to actually send emails. |
| `TRIGGER_SECRET` | Authorizes the manual-trigger HTTP endpoint. Arbitrary value you choose — **not** the same as `RESEND_API_KEY**. |

After setting either, redeploy: `npx wrangler deploy` (secrets apply
immediately, but make sure the worker is also running the latest *code* —
deploys here are never automatic).

**On GitHub** (Settings → Secrets and variables → Actions, for the
"Send Newsletter" workflow):

| Secret | Purpose |
|---|---|
| `NEWSLETTER_TRIGGER_URL` | The deployed newsletter worker's URL, e.g. `https://aimyselfandi-newsletter.<subdomain>.workers.dev`. Copy this straight from `wrangler deploy`'s output — don't guess it, and don't confuse it with the main blog's URL (both workers have very similar names; POSTing to the blog by mistake returns a misleading `405`). |
| `NEWSLETTER_TRIGGER_SECRET` | Must exactly match `TRIGGER_SECRET` set on the worker above. |

**Never paste any of the above values into a chat with Claude** — type them
directly into `wrangler`'s interactive prompt or GitHub's secret form. If a
secret value is ever accidentally exposed (e.g. pasted into a terminal `-v`
log that got shared), rotate it immediately.

## Known gotchas (hit before, worth remembering)

- A fresh container/session has no `node_modules` — `npm run build` fails
  with `astro: not found` until `npm install` runs.
- `newsletter-worker/` has its own separate `node_modules` / `package.json`
  — installing the root doesn't cover it.
- The sandbox's default `python3` can resolve to a broken system Pillow
  install; use `python3.13` explicitly for image conversion.
- A `405` from the newsletter worker on a POST almost always means the
  request hit the *main blog* (static asset serving rejects POST) instead of
  the dedicated newsletter worker — check `NEWSLETTER_TRIGGER_URL`.
- `wrangler secret put` requires the worker to actually be *deployed*
  afterward for code changes to take effect; setting a secret alone doesn't
  redeploy code.
