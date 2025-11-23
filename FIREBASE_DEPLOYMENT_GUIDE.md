# Firebase Security Rules Deployment Guide

## ⚠️ CRITICAL: Deploy These Rules ASAP

The code changes in this PR require Firebase Security Rules to be deployed. Without these rules, the authentication will not work properly.

---

## 🚀 Quick Deployment Steps

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: `smile-center-7c6f5`

### Step 2: Deploy Firestore Rules
1. Click **Firestore Database** in the left sidebar
2. Click the **Rules** tab at the top
3. **Copy** the entire Firestore rules from `FIREBASE_SECURITY_RULES.md` (lines 14-80)
4. **Paste** into the Firebase Console rules editor
5. Click **Publish**
6. Confirm the deployment

### Step 3: Deploy Storage Rules
1. Click **Storage** in the left sidebar
2. Click the **Rules** tab at the top
3. **Copy** the entire Storage rules from `FIREBASE_SECURITY_RULES.md` (lines 88-107)
4. **Paste** into the Firebase Console rules editor
5. Click **Publish**
6. Confirm the deployment

### Step 4: Create Admin User Document
1. Go to **Firestore Database**
2. Click **+ Start collection**
3. Collection ID: `users`
4. Click **Next**
5. **Document ID:** Use the Firebase Auth UID of your admin user
   - To find this: Go to **Authentication** → **Users** → Copy the UID
6. Add these fields:
   - `uid` (string): `<paste-the-auth-uid>`
   - `email` (string): `admin@smile.com`
   - `role` (string): `admin`
   - `createdAt` (number): `1700000000000` (or use current timestamp)
7. Click **Save**

### Step 5: Create Designer User Documents
Repeat Step 4 for each designer:
- `role`: `designer`
- `email`: `designer1@smile.com` (or their actual email)

### Step 6: Test Authentication
1. Try logging in as admin
2. Try logging in as designer
3. Try logging in as client
4. Verify proper redirection to respective portals

---

## 📋 Firestore Rules (Copy This)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isDesigner() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'designer';
    }

    function isClient() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'client';
    }

    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    match /projects/{projectId} {
      allow read, write: if isAdmin();
      allow read: if isDesigner();
      allow update: if isDesigner() &&
                      resource.data.assignedDesignerEmail == request.auth.token.email;
      allow read: if isClient() &&
                    resource.data.clientEmail == request.auth.token.email;
      allow create: if isClient();
      allow update: if isClient() &&
                      resource.data.clientEmail == request.auth.token.email &&
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['htmlApproved', 'clientRemarks', 'remarksAt', 'approvedAt', 'stlDownloaded', 'stlDownloadedAt', 'stlDownloadedFile', 'status']);
    }

    match /invites/{inviteId} {
      allow read: if true;
      allow create: if isAdmin();
      allow update: if true;
      allow delete: if isAdmin();
    }

    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
  }
}
```

---

## 📋 Storage Rules (Copy This)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }

    match /projects/{projectId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     (getUserRole() == 'admin' || getUserRole() == 'designer' || getUserRole() == 'client');
      allow delete: if request.auth != null && getUserRole() == 'admin';
    }
  }
}
```

---

## ✅ Verification Checklist

After deploying rules:

- [ ] Firestore rules show "Published" status
- [ ] Storage rules show "Published" status
- [ ] At least one admin user document exists in `users` collection
- [ ] Admin can log in successfully
- [ ] Admin redirects to `admin-panel.html`
- [ ] Designer redirects to `designer-portal.html`
- [ ] Client redirects to `portal-dashboard.html`
- [ ] Users without profiles get "User profile not found" error
- [ ] No console errors in browser DevTools

---

## 🆘 Troubleshooting

### Error: "User profile not found"
**Cause:** No document exists in `users` collection for this user's UID

**Solution:**
1. Go to Firebase Console → Authentication → Users
2. Find the user's UID
3. Go to Firestore Database → `users` collection
4. Create document with that UID as Document ID
5. Add required fields: `uid`, `email`, `role`, `createdAt`

### Error: "Invalid user role"
**Cause:** User document exists but `role` field is missing or invalid

**Solution:**
1. Check the user's document in Firestore
2. Ensure `role` field is exactly one of: `admin`, `designer`, `client`
3. Check for typos (case-sensitive)

### Error: "Permission denied"
**Cause:** Firebase Security Rules not deployed correctly

**Solution:**
1. Verify rules are published in Firebase Console
2. Check for syntax errors in rules
3. Test rules using Firebase Rules Playground

### Users can't access files
**Cause:** Storage rules not deployed

**Solution:**
1. Deploy Storage rules from this guide
2. Verify they're published in Firebase Console

---

## 📞 Need Help?

1. Check `FIREBASE_SECURITY_RULES.md` for detailed explanations
2. Use Firebase Console → Rules Playground to test rules
3. Check browser console for detailed error messages
4. Verify all steps in this guide were completed

---

## 🎯 Summary

**Time Required:** ~10 minutes

**Steps:**
1. ✅ Deploy Firestore rules
2. ✅ Deploy Storage rules
3. ✅ Create admin user document
4. ✅ Create designer user documents (if any)
5. ✅ Test authentication

**Critical:** This must be completed before the code changes go live!
