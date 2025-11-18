# SMILE CENTER WORKFLOW GUIDE

## Branches
- **main** → Production (www.smilecenter.pro)
- **development** → Preview/Testing (auto Vercel URL)
- **backup** → Safe backup (no deploy)

## Quick Commands

### Switch to development (for testing)
```bash
cd "C:\Users\avico\Downloads\CLONE\Landing-page-"
git checkout development
```

### Make changes and test
```bash
git add .
git commit -m "describe changes"
git push
# Check preview URL in Vercel dashboard
```

### Deploy to production
```bash
git checkout main
git merge development
git push
# Live in ~30 seconds
```

### Create backup
```bash
git checkout backup
git merge main
git push
```

### Emergency rollback
```bash
git checkout main
git reset --hard backup
git push --force
```

## Files to Never Edit Directly on Main
- admin-panel.html
- portal-dashboard.html
- designer-portal.html
- Firebase config (in all HTML files)

## Always Test First
1. Make changes on `development`
2. Push and check preview URL
3. If good → merge to `main`
4. If bad → just delete development changes
