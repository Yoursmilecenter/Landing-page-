# Smile Center Portal - Project Workflow Guide

## Project Info
- **Name:** Smile Center Portal
- **Location:** `C:\Users\avico\Downloads\CLONE\Landing-page-`
- **Live Site:** www.smilecenter.pro
- **GitHub:** https://github.com/Yoursmilecenter/Landing-page-.git
- **Hosting:** Vercel (auto-deploys from `main` branch)

## Branch Strategy
- **main** → Production (Vercel deploys from here)
- **development** → Active work (ALWAYS work here)
- **backup** → Safety net (don't touch unless emergency)

## Standard Workflow
1. Always work on `development` branch
2. Test locally: `python -m http.server 8000` → `http://localhost:8000`
3. Commit & push to development
4. When ready: merge development → main
5. Vercel auto-deploys in 1-2 minutes

## Git Commands
```powershell
# Check status
cd "C:\Users\avico\Downloads\CLONE\Landing-page-"
git status

# Commit changes
git add [file]
git commit -m "message"
git push origin development

# Deploy to production
git checkout main
git merge development
git push origin main
git checkout development
```

## Firebase Config
- Same Firebase project for local and Vercel
- Config in all HTML files (portal-login, admin-panel, designer-portal, portal-dashboard)

## User Roles
- **Admin:** admin@smile.com → admin-panel.html
- **Designers:** designer1@smile.com, designer2@smile.com → designer-portal.html
- **Clients:** [email]@smile.local → portal-dashboard.html

## Key Files
- `portal-login.html` - Login & routing logic
- `admin-panel.html` - Admin management
- `designer-portal.html` - Designer workspace
- `portal-dashboard.html` - Client dashboard
- `style.css` - Global styles

## Testing Checklist
- [ ] Test admin login routing
- [ ] Test designer login routing
- [ ] Test client login routing
- [ ] Check file uploads
- [ ] Verify Firebase connection
- [ ] Test on localhost before deploy

## Common Issues
1. **Login routing wrong** → Check userCredential.user.email in portal-login.html
2. **Files not deploying** → Verify main branch pushed to GitHub
3. **Firebase errors** → Check API keys match in all HTML files
