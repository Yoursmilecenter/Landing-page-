# Vercel Settings Configuration

## Steps to Configure Production Branch:

1. Click **"Settings"** tab (top navigation)

2. In left sidebar, click **"Git"**

3. Find **"Production Branch"** section
   - Set to: `main`
   - This makes ONLY main branch deploy to live site

4. Find **"Deploy Hooks"** or **"Ignored Build Step"** section
   - You can add branches to ignore or enable preview for specific branches

5. **Preview Deployments** section
   - Should be enabled automatically for all branches except main
   - `development` branch will get preview URLs
   - `backup` branch won't deploy anything

6. Click **"Save"**

---

## What This Does:

- **main branch** → www.smilecenter.pro (LIVE)
- **development branch** → Preview URL like `landingpage-xyz123.vercel.app` (TEST)
- **backup branch** → No deployment (BACKUP ONLY)

---

## Current Status (from screenshot):
✅ Production is deploying from `main` branch
✅ Your live site: www.smilecenter.pro

You're already configured correctly! Just need to verify preview deployments are enabled for development branch.
