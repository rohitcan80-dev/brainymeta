# Brainy Bee's STEM — website

STEM tutoring site (grades 1–6) replacing the old summer camp site in this same repo.
Stack matches what was already set up: **Cloudflare Pages** (static hosting) +
**Cloudflare Worker** (contact form backend) + **Cloudflare KV** (stores submissions) +
**Resend** (sends the emails). Deployed automatically via GitHub Actions on every push to `main`.

**Domain: brainybee.ca** — the old repo/guide referenced `brainybeescamp.ca`, which was
wrong for this project. Everything below is corrected to `brainybee.ca`.

## Files in this package → where they go in your repo

| This file | Goes to (in your repo) |
|---|---|
| `index.html` | repo root |
| `wrangler.toml` | repo root (replaces the old one) |
| `package.json` | repo root (replaces the old one) |
| `github-actions-deploy.yml` | `.github/workflows/deploy.yml` |
| `registration-worker.js` | `workers/registration.js` (replaces the old camp worker code) |

## 1. Replace the files in your existing repo

Don't delete the repo — just swap the old camp files for these, keeping `.git` intact:

```bash
git clone <your-repo-url>
cd <your-repo>
git checkout -b stem-site
# copy the new files into place as per the table above, removing old camp-only files
git add -A
git commit -m "Replace summer camp site with STEM tutoring site"
git push -u origin stem-site
# open a PR, review the diff, merge to main
```

## 2. Reused vs. new

Since you already have the Cloudflare account, KV namespace, and Resend API key set up:
- **KV namespace**: unchanged — same `REGISTRATIONS` binding, just reused for inquiries instead of registrations. Make sure the real KV ID (not the `YOUR_KV_NAMESPACE_ID_HERE` placeholder) is filled into `wrangler.toml` — copy it from your old `wrangler.toml` or from **Cloudflare Dashboard → Workers & Pages → KV**.
- **Resend API key**: unchanged. Just double check in **Resend → Domains** that `brainybee.ca` (not `brainybeescamp.ca`) is added and verified — Resend won't send from an unverified domain. The worker sends from `info@brainybee.ca` / `noreply@brainybee.ca`.
- **Worker**: same name (`brainy-bees-registration`), same deployment — this update just replaces its code, so it goes out to the same URL you already have. No new Worker is created.
- **GitHub Actions secrets** (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`): already in your repo settings from before — nothing to redo.

## 3. One thing YOU need to fill in: the Worker URL

Open `index.html`, find this line near the bottom:
```js
const WORKER_URL = 'https://brainy-bees-registration.YOUR-ACCOUNT.workers.dev';
```
Replace `YOUR-ACCOUNT` with your actual Cloudflare Workers subdomain (find it at
**Cloudflare Dashboard → Workers & Pages** — it's the same one the old camp site was
already using, since this is the same Worker).

## 4. Cloudflare Pages custom domain

In **Cloudflare Dashboard → Pages → your project → Custom Domains**, make sure
`brainybee.ca` (and `www.brainybee.ca` if you use it) is added — not `brainybeescamp.ca`.
If `brainybeescamp.ca` is still attached from before and you don't need it anymore, you
can remove it there.

## 5. Go-live checklist

- [ ] Site loads at brainybee.ca over https
- [ ] Nav tabs (Why STEM / Programs / Trainers / Resources / Contact Us) all switch correctly
- [ ] Submit the contact form yourself as a test
- [ ] You receive the notification email at info@brainybee.ca
- [ ] The test submitter receives the confirmation email
- [ ] Trainer LinkedIn links open correctly
- [ ] WhatsApp button opens with the right pre-filled message

## Still placeholder / to finish
- Trainer photos (currently initials avatars)
- The 3 "From our notebook" articles are titles only — no full posts written yet
- No pricing shown (Contact Us / inquiry only, as requested)
