# satanblowme.github.io

Personal site + shop deploy pipeline for Neocities.

## What this repo does

- Pulls product data from Spree into `data/products.json`
- Generates static shop output (for example `public/store.html`)
- Deploys `public/` to Neocities via GitHub Actions

---

## One-time setup

Set these GitHub Actions secrets in:
**Repo → Settings → Secrets and variables → Actions**

- `NEOCITIES_API_TOKEN` (required for deploy)
- `SPREE_API_URL` (required for product sync)
- `SPREE_API_KEY` (required for product sync)

---

## Daily workflows

### 1) You changed products in Spree

From repo root:

```bash
npm run sync
npm run generate-site
git add data/products.json public/store.html
git commit -m "sync products from Spree"
git pull --rebase origin main
git push origin main
```

### 2) You changed local site files (HTML/CSS/JS/content)

From repo root:

```bash
# only needed if your edits affect generated store output
npm run generate-site

git add .
git commit -m "update site"
git pull --rebase origin main
git push origin main
```

Pushing to `main` triggers deploy workflow(s).

---

## If push is rejected (non-fast-forward)

Run:

```bash
git pull --rebase origin main
```

If there are conflicts:

```bash
# fix conflicted files
git add <fixed-files>
git rebase --continue
git push origin main
```

---

## Deploy script behavior (important)

`scripts/deployNeocities.js` is non-interactive for CI:

- No stdin prompt/confirmation
- Exits with code `0` on success, `1` on failure

This prevents hanging terminals in non-TTY environments.

---

## Quick troubleshooting

### Terminal hangs during deploy

- Make sure there is no prompt/read from stdin in deploy script
- Re-run after pulling latest `main`

### `NEOCITIES_API_TOKEN not set`

- Add/update the secret in GitHub Actions secrets

### Workflow fails on Spree fetch in CI

- Ensure `SPREE_API_URL` and `SPREE_API_KEY` are set
- If intentionally deploying committed data only, keep sync in separate workflow
