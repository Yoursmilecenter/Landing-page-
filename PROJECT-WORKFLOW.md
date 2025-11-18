# Smile Center Portal - Project Workflow Guide

## Project Info
- **Name:** Smile Center Portal
- **Location:** `C:\Users\avico\Downloads\CLONE\Landing-page-`
- **Live Site:** www.smilecenter.pro
- **GitHub:** https://github.com/Yoursmilecenter/Landing-page-.git
- **Hosting:** Vercel (auto-deploys from `main` branch)
- **Firebase Project:** smile-center-7c6f5

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

# Update backup
git checkout backup
git merge main
git push origin backup
git checkout development
```

## Firebase Config
- **Project ID:** smile-center-7c6f5
- **Authentication:** Email/Password enabled
- **Firestore Database:** Used for projects and invites
- **Cloud Storage:** Used for patient files
- Same Firebase project for local and Vercel
- Config in all HTML files (portal-login, admin-panel, designer-portal, portal-dashboard)

## User Roles & Authentication
- **Admin:** admin@smile.com → admin-panel.html
- **Designers:** designer1@smile.com, designer2@smile.com → designer-portal.html
- **Clients:** [phone]@smile.local OR [username]@smile.local → portal-dashboard.html
- **Login Format:** Username (auto-converts to @smile.local) or full email

## Firebase Security Rules

### Firestore Security Rules (LIVE)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Projects collection
    match /projects/{projectId} {
      allow read: if request.auth != null && 
                     (resource.data.clientEmail == request.auth.token.email ||
                      request.auth.token.email in ['admin@smile.com', 'designer1@smile.com', 'designer2@smile.com'] ||
                      resource.data.assignedDesignerEmail == request.auth.token.email);
      
      allow create: if request.auth != null && 
                       (request.auth.token.email == 'admin@smile.com' ||
                        request.resource.data.clientEmail == request.auth.token.email);
      
      allow update: if request.auth != null && 
                       (request.auth.token.email == 'admin@smile.com' ||
                        resource.data.assignedDesignerEmail == request.auth.token.email ||
                        resource.data.clientEmail == request.auth.token.email);
      
      allow delete: if request.auth != null && 
                       request.auth.token.email == 'admin@smile.com';
    }
    
    // Invites collection
    match /invites/{inviteId} {
      allow create: if request.auth != null && 
                       request.auth.token.email == 'admin@smile.com';
      
      allow read: if request.auth != null;
      
      allow update: if request.auth != null && 
                       (request.auth.token.email == 'admin@smile.com' ||
                        (request.resource.data.used == true && resource.data.used == false));
      
      allow delete: if request.auth != null && 
                       request.auth.token.email == 'admin@smile.com';
    }
  }
}
```

### Storage Security Rules (LIVE)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{fileName} {
      allow read: if request.auth != null &&
                     (request.auth.token.email == 'admin@smile.com' ||
                      request.auth.token.email in ['designer1@smile.com', 'designer2@smile.com'] ||
                      firestore.get(/databases/(default)/documents/projects/$(projectId)).data.clientEmail == request.auth.token.email);
      
      allow write: if request.auth != null &&
                      (request.auth.token.email == 'admin@smile.com' ||
                       firestore.get(/databases/(default)/documents/projects/$(projectId)).data.assignedDesignerEmail == request.auth.token.email ||
                       firestore.get(/databases/(default)/documents/projects/$(projectId)).data.clientEmail == request.auth.token.email);
    }
  }
}
```

## Key Features

### Admin Features
- View all patients/projects with filtering and sorting
- Assign designers to patients
- Update patient status
- Mark patients as Urgent or VIP
- Upload/manage files for any patient
- Delete patients
- Generate invite links for new clients
- Add clients directly (username + email + password)

### Designer Features
- View assigned patients only
- Upload HTML preview files
- Upload STL files (after client approval)
- Download patient files
- See client feedback on designs

### Client Features
- Create new patients
- View own patients only
- Upload files to patients
- Preview HTML designs
- Approve or request changes on HTML designs
- Download final STL files (after HTML approval)

### Invite System
- Admin generates invite link with phone number
- Link format: `https://www.smilecenter.pro/portal-login.html?invite={code}&phone={phone}`
- Client registers with phone + password
- Phone becomes login username (converts to phone@smile.local)
- Invite marked as used after registration

## Key Files
- `portal-login.html` - Login, routing, invite registration
- `admin-panel.html` - Admin management panel
- `designer-portal.html` - Designer workspace
- `portal-dashboard.html` - Client dashboard
- `style.css` - Global styles
- `PROJECT-WORKFLOW.md` - This file (project documentation)

## Security Features (IMPLEMENTED)
✅ **Server-side Firebase Security Rules**
✅ **Role-based access control (RBAC)**
✅ **Permission-denied error handling**
✅ **Clients can only see their own projects**
✅ **Designers can only see assigned projects**
✅ **Admins have full access**
✅ **Secure file storage with role-based access**
✅ **Invite system with one-time use codes**

## Error Handling
All portals (admin, designer, client) include:
```javascript
catch (error) {
    console.error('Error:', error);
    if (error.code === 'permission-denied') {
        alert('Access denied. Please contact administrator.');
    }
    render();
}
```

## Testing Checklist
- [x] Admin login routing
- [x] Designer login routing
- [x] Client login routing (username and email)
- [x] Invite link generation
- [x] Client registration via invite
- [x] Client creates new patient
- [x] File uploads (all roles)
- [x] Permission-based file access
- [x] Firebase security rules enforcement
- [ ] Test on localhost before major changes
- [ ] Verify all features after deployment

## Deployment Status
- **Last Updated:** November 2024
- **Security Rules:** ✅ Active and enforced
- **All Features:** ✅ Working on production
- **Branch Status:** Development and main in sync

## Common Issues & Solutions
1. **"Missing or insufficient permissions"** → Check Firebase Security Rules in console
2. **Login routing wrong** → Verify email format and role arrays in portal-login.html
3. **Files not deploying** → Ensure main branch pushed to GitHub (Vercel watches main)
4. **Firebase errors** → Check API keys match in all HTML files
5. **Invite link not working** → Verify invites collection rules allow read for authenticated users
6. **Client can't create patient** → Ensure clientEmail matches auth.token.email in security rules

## Quick Start for AI Assistant
When helping with this project:
1. Read this file first to understand the setup
2. Check current branch: `git status`
3. Always work on `development` branch
4. Test locally before deploying
5. Security rules are already configured - don't modify without checking this file
6. Use Desktop Commander for file operations and Git commands
