# Firebase Security Rules - Critical Implementation Guide

## ⚠️ CRITICAL SECURITY ISSUE

Your current implementation has **client-side authentication logic** which can be bypassed. Follow this guide to implement proper security.

---

## 🔐 Firestore Security Rules

Replace your current Firestore rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to check if user is admin
    function isAdmin() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Helper function to check if user is designer
    function isDesigner() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'designer';
    }

    // Helper function to check if user is client
    function isClient() {
      return isSignedIn() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'client';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    // Projects collection
    match /projects/{projectId} {
      // Admins can do everything
      allow read, write: if isAdmin();

      // Designers can read all, update assigned projects
      allow read: if isDesigner();
      allow update: if isDesigner() &&
                      resource.data.assignedDesignerEmail == request.auth.token.email;

      // Clients can only see their own projects
      allow read: if isClient() &&
                    resource.data.clientEmail == request.auth.token.email;
      allow create: if isClient();
      allow update: if isClient() &&
                      resource.data.clientEmail == request.auth.token.email &&
                      // Clients can only update these fields:
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['htmlApproved', 'clientRemarks', 'remarksAt', 'approvedAt', 'stlDownloaded', 'stlDownloadedAt', 'stlDownloadedFile', 'status']);
    }

    // Invites collection
    match /invites/{inviteId} {
      allow read: if true; // Anyone can read to verify invite codes
      allow create: if isAdmin();
      allow update: if true; // Needed for marking invite as used during registration
      allow delete: if isAdmin();
    }

    // Audit logs collection
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if false; // Audit logs should never be modified
    }
  }
}
```

---

## 🗄️ Storage Security Rules

Replace your Firebase Storage rules with these:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper to get user role from Firestore
    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }

    // Projects folder
    match /projects/{projectId}/{fileName} {
      // Anyone authenticated can read
      allow read: if request.auth != null;

      // Admins and designers can upload
      allow write: if request.auth != null &&
                     (getUserRole() == 'admin' || getUserRole() == 'designer' || getUserRole() == 'client');

      // Prevent deletion except by admins
      allow delete: if request.auth != null && getUserRole() == 'admin';
    }
  }
}
```

---

## 👥 User Role Setup

### Step 1: Create Admin User in Firestore

After setting up the rules, manually create admin users in Firestore Console:

**Collection:** `users`
**Document ID:** `<firebase-auth-uid>`
**Fields:**
```json
{
  "uid": "<firebase-auth-uid>",
  "email": "admin@smile.com",
  "role": "admin",
  "createdAt": 1700000000000
}
```

### Step 2: Create Designer Users

**Collection:** `users`
**Document ID:** `<firebase-auth-uid>`
**Fields:**
```json
{
  "uid": "<firebase-auth-uid>",
  "email": "designer1@smile.com",
  "role": "designer",
  "createdAt": 1700000000000
}
```

### Step 3: Update Client Registration

The client registration code already creates user documents - just ensure it sets `role: 'client'` (which it does).

---

## 🔧 Code Changes Required

### 1. Remove Hardcoded Credentials from `portal-login.html`

**REMOVE these lines (90-91):**
```javascript
const admins = ['admin@smile.com'];
const designers = ['designer1@smile.com', 'designer2@smile.com'];
```

**REPLACE the login handler with:**
```javascript
window.handleLogin = async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const statusEl = document.getElementById('loginStatus');

    let loginEmail = email;

    // If only numbers (phone), convert to phone@smilecenter.pro
    if (/^\d+$/.test(email)) {
        loginEmail = email + '@smilecenter.pro';
    }
    // If no @ symbol, treat as username
    else if (!email.includes('@')) {
        loginEmail = email + '@smilecenter.pro';
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);

        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (!userDoc.exists()) {
            statusEl.textContent = 'User profile not found. Contact administrator.';
            statusEl.className = 'status-msg active error';
            await signOut(auth);
            return;
        }

        const userData = userDoc.data();
        const role = userData.role;

        // Redirect based on role
        if (role === 'admin') {
            window.location.href = 'admin-panel.html';
        } else if (role === 'designer') {
            window.location.href = 'designer-portal.html';
        } else if (role === 'client') {
            window.location.href = 'portal-dashboard.html';
        } else {
            statusEl.textContent = 'Invalid user role';
            statusEl.className = 'status-msg active error';
            await signOut(auth);
        }
    } catch (error) {
        console.error('Login error:', error);
        statusEl.textContent = 'Invalid credentials';
        statusEl.className = 'status-msg active error';
    }
};
```

### 2. Add Required Import

Add this to the imports at the top of `portal-login.html`:
```javascript
import { getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
```

---

## 🚀 Deployment Steps

1. **Go to Firebase Console** → Your Project
2. **Firestore Database** → Rules tab → Paste the Firestore rules above
3. **Storage** → Rules tab → Paste the Storage rules above
4. **Click "Publish"** for both
5. **Create admin/designer user documents** in Firestore as shown above
6. **Update the code** in portal-login.html as shown above
7. **Test thoroughly** before deploying to production

---

## ✅ Testing Checklist

- [ ] Admin can log in and access admin panel
- [ ] Designer can log in and access designer portal
- [ ] Client can log in and access dashboard
- [ ] Client can only see their own projects
- [ ] Client cannot modify other users' projects
- [ ] Designer can see all projects but only update assigned ones
- [ ] Unauthorized users cannot access Firestore data
- [ ] File uploads work for all roles
- [ ] Audit logs are created but cannot be modified

---

## 📞 Support

If you need help implementing these rules:
1. Test in Firebase Emulator first
2. Monitor the Firestore Rules tab for any errors
3. Check browser console for authentication errors
4. Enable Firebase Debug Mode for detailed logs

---

**IMPORTANT:** These rules must be implemented before going to production. The current client-side auth can be easily bypassed!
