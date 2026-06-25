# Next Boost

Social engagement exchange platform — earn points by completing tasks, spend points to grow your TikTok, Instagram, and YouTube following.

**Live at:** https://boost.nexosites.xyz

---

## File Structure

```
nextboost/
├── index.html               ← Landing page
├── login/index.html         → /login/
├── signup/index.html        → /signup/
├── dashboard/index.html     → /dashboard/
├── reset-password/index.html → /reset-password/
├── confirm-email/index.html → /confirm-email/
├── 404.html                 ← GitHub Pages custom 404
├── CNAME                    ← Custom domain
├── robots.txt
├── sitemap.xml
├── _config.yml              ← Jekyll config for GitHub Pages
├── assets/
│   ├── css/
│   │   ├── main.css         ← Shared styles
│   │   ├── landing.css      ← Landing page styles
│   │   └── dashboard.css    ← Dashboard styles
│   ├── js/
│   │   └── shared.js        ← Supabase client + utilities
│   └── img/
│       ├── logo.svg
│       └── favicon.svg
└── .github/
    └── workflows/
        └── deploy.yml       ← Auto-deploy to GitHub Pages
```

---

## Deployment Steps

### 1. Create GitHub repo

- Go to github.com → New repository
- Name it: `nextboost` (or anything)
- Set to **Public**
- Do NOT initialise with README

### 2. Push this folder

```bash
cd nextboost
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/griesel050-web/nextboost.git
git push -u origin main
```

### 3. Enable GitHub Pages

- Go to your repo → **Settings → Pages**
- Source: **GitHub Actions**
- The deploy.yml workflow will auto-run on every push

### 4. Set custom domain

- In Settings → Pages → Custom domain: enter `boost.nexosites.xyz`
- At your domain registrar (where nexosites.xyz is managed), add a **CNAME record**:
  - Name: `boost`
  - Value: `griesel050-web.github.io`
- Tick **Enforce HTTPS** once DNS propagates (can take up to 24h)

### 5. Configure Supabase Auth redirect URLs

This is REQUIRED or confirm/reset emails will 404.

- Go to https://supabase.com/dashboard/project/slufbzzfofzptwjefzmu
- **Authentication → URL Configuration**
- Set **Site URL** to: `https://boost.nexosites.xyz`
- Add these to **Redirect URLs**:
  ```
  https://boost.nexosites.xyz/confirm-email/
  https://boost.nexosites.xyz/reset-password/
  https://boost.nexosites.xyz/**
  ```

### 6. Verify email templates (optional but recommended)

- In Supabase → **Authentication → Email Templates**
- The confirm and reset links will automatically use the redirect URLs above
- No changes needed unless you want to customise the email copy

---

## Points System Security

The points system is fully server-side and tamper-proof:

- **`post_task()`** — atomic SQL function: checks balance, deducts points, and creates task in one transaction. Cannot be split.
- **`complete_task()`** — atomic SQL function: checks task exists + is active + user hasn't already done it + user isn't the owner, then awards points. All in one locked transaction.
- **`completions` table** — has a `UNIQUE(task_id, user_id)` constraint. Even if someone sends two requests simultaneously, the DB rejects the second.
- **`point_ledger`** — immutable audit trail of every point movement.
- **`profiles.points >= 0`** — DB-level check constraint. Points can never go negative.
- **RLS enabled** on all tables — users can only read/write their own data.
- All validation happens in Postgres `security definer` functions, not in the browser.

---

## Tech Stack

- **Frontend:** Vanilla HTML + CSS + JS (ES modules)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Hosting:** GitHub Pages
- **Domain:** boost.nexosites.xyz via CNAME
