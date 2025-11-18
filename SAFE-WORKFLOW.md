# SAFE DEPLOYMENT WORKFLOW

## How It Works

### 3 Environments:
1. **development branch** → Vercel Preview URL (for testing)
2. **main branch** → www.smilecenter.pro (LIVE site)
3. **backup branch** → Safety backup (no website)

---

## Your Workflow (Safe Method)

### Step 1: Work on Development (Testing)
```powershell
cd "C:\Users\avico\Downloads\CLONE\Landing-page-"
git checkout development
# Make your changes to files
git add .
git commit -m "testing new feature"
git push
```
**Result:** Changes go to **preview URL only** (not live site)

### Step 2: Test the Preview
- Go to Vercel dashboard
- Find the development deployment
- Click the preview URL
- Test everything thoroughly

### Step 3: Deploy to Live (Only if tests pass)
```powershell
git checkout main
git merge development
git push
```
**Result:** Now changes go to **www.smilecenter.pro** (LIVE)

### Step 4: Create Backup (After successful deploy)
```powershell
.\deploy.ps1
# Choose "backup"
```

---

## What You NEVER Do:
❌ Never push directly to `main` branch
❌ Never edit files while on `main` branch

## What You ALWAYS Do:
✅ Always work on `development` branch
✅ Always test preview URL first
✅ Only merge to `main` when 100% sure
✅ Create backup after each live deploy

---

## Emergency Rollback (if live site breaks)
```powershell
git checkout main
git reset --hard backup
git push --force
```
This restores live site to last backup in 30 seconds.
