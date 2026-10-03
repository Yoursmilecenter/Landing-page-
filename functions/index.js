// Server-side account and invite handling for smilecenter.pro.
// Every write that grants access (a role, an approved status, a gift prize,
// marking an invite used) happens here with the Admin SDK, never in the browser.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

const db = getFirestore();
const auth = getAuth();

const DOMAIN = 'smilecenter.pro';
const MIN_PASSWORD = 10;
const MAX_PENDING = 100;
const USERNAME = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Phone logins are "<digits>@smilecenter.pro". Strip spaces/dashes/+ and turn +972 into a leading 0
// so "050-123 4567", "+972 50 1234567" and "0501234567" all map to the same account.
const normPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.startsWith('972') && d.length === 12 ? '0' + d.slice(3) : d;
};
const teethOf = (prize) => { const m = /^teeth_(\d+)$/.exec(prize || ''); return m ? Number(m[1]) : 0; };
const fail = (code, reason) => { throw new HttpsError(code, reason); };

function requirePassword(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD || pw.length > 128) fail('invalid-argument', 'weak-password');
}

// Anyone can create a bare Firebase Auth login from the browser SDK (anonymous gift sign-in needs sign-up enabled),
// e.g. to grab "0501234567@smilecenter.pro" before the admin creates that client. Such a login has no users/{uid}
// profile, so the rules give it nothing. When a real account needs that address, the orphan is removed.
// The age check keeps a sign-up that is mid-way (login created, profile not yet written) from being taken over.
const ORPHAN_MIN_AGE_MS = Number(process.env.ORPHAN_MIN_AGE_MS ?? 2 * 60 * 1000);

async function reclaimOrphanLogin(email) {
  let u;
  try { u = await auth.getUserByEmail(email); } catch { return false; }
  const age = Date.now() - new Date(u.metadata.creationTime).getTime();
  if (!(age >= ORPHAN_MIN_AGE_MS)) return false;
  const profile = await db.doc(`users/${u.uid}`).get();
  if (profile.exists) return false;
  await auth.deleteUser(u.uid);
  console.warn('removed orphan login without profile', { uid: u.uid, email, age });
  return true;
}

async function createAuthUser(email, password, displayName, retried = false) {
  try {
    return await auth.createUser({ email, password, ...(displayName ? { displayName } : {}) });
  } catch (e) {
    if (e.code === 'auth/email-already-exists' && !retried && await reclaimOrphanLogin(email)) {
      return createAuthUser(email, password, displayName, true);
    }
    if (e.code === 'auth/email-already-exists') fail('already-exists', 'account-exists');
    if (e.code === 'auth/invalid-email') fail('invalid-argument', 'bad-email');
    if (e.code === 'auth/invalid-password') fail('invalid-argument', 'weak-password');
    throw e;
  }
}

async function requireAdmin(req) {
  const uid = req.auth?.uid;
  if (!uid) fail('unauthenticated', 'sign-in');
  const snap = await db.doc(`users/${uid}`).get();
  const u = snap.exists ? snap.data() : null;
  if (!u || u.role !== 'admin' || ['pending', 'rejected'].includes(u.status)) fail('permission-denied', 'admin-only');
  return { uid, email: req.auth.token.email || null };
}

// Account and gift events land in the admin "Audit Logs" page. Logging never blocks the action itself.
async function audit(req, eventType, userEmail, details) {
  try {
    await db.collection('auditLogs').add({
      eventType, userEmail: userEmail || null, details: String(details || '').slice(0, 900),
      ipAddress: req.rawRequest?.ip || null, timestamp: Date.now(),
      userAgent: String(req.rawRequest?.headers?.['user-agent'] || '').slice(0, 300),
    });
  } catch (e) {
    console.error('audit log failed', e);
  }
}

// Per-IP fixed window, kept in rateLimits/{key} (no client access: the database rules don't match that collection).
// Stops one visitor from filling the pending-approval queue (MAX_PENDING) and blocking real sign-ups.
const SIGNUPS_PER_IP_PER_HOUR = Number(process.env.SIGNUPS_PER_IP_PER_HOUR ?? 5);

async function rateLimit(req, action, max, windowMs) {
  // Behind Google's front end the visitor is the first X-Forwarded-For entry (rawRequest.ip can be the proxy)
  const fwd = String(req.rawRequest?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = String(fwd || req.rawRequest?.ip || 'unknown').replace(/[^0-9a-fA-F:.]/g, '').slice(0, 64) || 'unknown';
  const ref = db.doc(`rateLimits/${action}_${ip.replace(/[:.]/g, '-')}`);
  const now = Date.now();
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const d = s.exists ? s.data() : null;
    if (!d || now - d.windowStart > windowMs) { tx.set(ref, { windowStart: now, count: 1, expiresAt: new Date(now + windowMs) }); return; }
    if (d.count >= max) fail('resource-exhausted', 'too-many-requests');
    tx.update(ref, { count: d.count + 1 });
  });
}

function giftState(inv) {
  if (!inv || inv.type !== 'mystery') return 'invalid';
  if (inv.status === 'redeemed' || inv.used) return 'redeemed';
  if (inv.expiresAt && Date.now() > inv.expiresAt) return 'expired';
  return 'ok';
}

// Public: what an invite link shows before anyone signs in.
export const checkInvite = onCall(async (req) => {
  const code = text(req.data?.code, 100);
  if (!code) fail('invalid-argument', 'invalid');
  const snap = await db.doc(`invites/${code}`).get();
  if (!snap.exists) fail('not-found', 'invalid');
  const inv = snap.data();
  if (inv.type === 'mystery') {
    const state = giftState(inv);
    if (state !== 'ok') fail('failed-precondition', state);
    return { type: 'mystery', clientName: inv.clientName || '', isDoctor: inv.isDoctor !== false,
             expiresAt: inv.expiresAt || null, teeth: teethOf(inv.prize) || 5 };
  }
  if (inv.used) fail('failed-precondition', 'used');
  return { type: 'phone', phone: inv.phone || '' };
});

// Gift link, first visit: the (anonymous) visitor becomes an approved client carrying the invite's prize.
export const redeemGift = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) fail('unauthenticated', 'sign-in');
  const code = text(req.data?.code, 100);
  if (!code) fail('invalid-argument', 'invalid');
  const invRef = db.doc(`invites/${code}`);
  const userRef = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const [invSnap, userSnap] = await Promise.all([tx.get(invRef), tx.get(userRef)]);
    const inv = invSnap.exists ? invSnap.data() : null;
    const state = giftState(inv);
    if (state !== 'ok') fail(state === 'invalid' ? 'not-found' : 'failed-precondition', state);
    if (!userSnap.exists) {
      tx.set(userRef, {
        uid, role: 'client', status: 'approved', loginType: 'gift',
        username: normPhone(inv.phone), phone: normPhone(inv.phone), clientName: inv.clientName || '',
        email: null, prize: inv.prize || null, needsPassword: true, inviteCode: code, createdAt: Date.now(),
      });
    } else if (userSnap.data().inviteCode !== code) {
      fail('failed-precondition', 'already-member');
    }
    tx.update(invRef, { status: 'opened', openedAt: Date.now(), uid });
  });
  await audit(req, 'gift-opened', null, `Gift link ${code.slice(0, 6)}… opened by guest ${uid.slice(0, 8)}`);
  return { ok: true };
});

// Gift, final step: attach the prize to a real (password) account and close the invite.
// Covers both "I just set a password on my gift account" and "add this gift to my existing account".
export const claimGift = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) fail('unauthenticated', 'sign-in');
  if (req.auth.token.firebase?.sign_in_provider === 'anonymous') fail('failed-precondition', 'set-password-first');
  const code = text(req.data?.code, 100);
  if (!code) fail('invalid-argument', 'invalid');
  const invRef = db.doc(`invites/${code}`);
  const userRef = db.doc(`users/${uid}`);
  let attached = false;
  await db.runTransaction(async (tx) => {
    const [invSnap, userSnap] = await Promise.all([tx.get(invRef), tx.get(userRef)]);
    if (!userSnap.exists) fail('failed-precondition', 'no-profile');
    const inv = invSnap.exists ? invSnap.data() : null;
    if (!inv || inv.type !== 'mystery') fail('not-found', 'invalid');
    const u = userSnap.data();
    const ownGift = u.inviteCode === code;
    if (inv.status === 'redeemed' || inv.used) {
      if (ownGift) return;                       // already closed for this account
      fail('failed-precondition', 'redeemed');
    }
    if (!ownGift) {
      if (inv.expiresAt && Date.now() > inv.expiresAt) fail('failed-precondition', 'expired');
      // One open gift per account: don't burn a second invite while the first is unspent.
      if (teethOf(u.prize) && !u.giftUsed) fail('failed-precondition', 'already-has-gift');
      tx.update(userRef, { prize: inv.prize || null, giftUsed: false, inviteCode: code });
      attached = true;
    }
    tx.update(invRef, { status: 'redeemed', used: true, redeemedAt: Date.now(), redeemedBy: uid });
  });
  await audit(req, 'gift-redeemed', req.auth.token.email, `Gift ${code.slice(0, 6)}… redeemed${attached ? ' and added to an existing account' : ''}`);
  return { ok: true, attached };
});

// Phone invite link: create the client account the admin invited.
export const registerWithInvite = onCall(async (req) => {
  const code = text(req.data?.code, 100);
  const password = req.data?.password;
  if (!code) fail('invalid-argument', 'invalid');
  requirePassword(password);
  const invRef = db.doc(`invites/${code}`);
  const pre = await invRef.get();
  const inv = pre.exists ? pre.data() : null;
  if (!inv || inv.type === 'mystery') fail('not-found', 'invalid');
  if (inv.used) fail('failed-precondition', 'used');
  const phone = normPhone(inv.phone);
  if (!/^\d{6,15}$/.test(phone)) fail('failed-precondition', 'invalid');
  const email = `${phone}@${DOMAIN}`;
  const user = await createAuthUser(email, password);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(invRef);
      if (!snap.exists || snap.data().used) fail('failed-precondition', 'used');
      tx.set(db.doc(`users/${user.uid}`), {
        uid: user.uid, username: phone, phone, email: null, role: 'client', status: 'approved',
        loginType: 'phone', createdAt: Date.now(), inviteCode: code,
      });
      tx.update(invRef, { used: true, usedAt: Date.now(), uid: user.uid });
    });
  } catch (e) {
    await auth.deleteUser(user.uid).catch(() => {});
    throw e;
  }
  await audit(req, 'account-created', email, 'Client registered from a phone invite');
  return { email };
});

// Public sign-up form: account is created but stays 'pending' until an admin approves it.
export const requestAccess = onCall(async (req) => {
  const username = text(req.data?.username, 30);
  const email = text(req.data?.email, 200);
  const password = req.data?.password;
  const fullName = text(req.data?.fullName, 120);
  const contactPhone = normPhone(text(req.data?.phone, 30));
  if (!USERNAME.test(username) || /^\d+$/.test(username)) fail('invalid-argument', 'bad-username');
  if (!EMAIL.test(email)) fail('invalid-argument', 'bad-email');
  requirePassword(password);
  await rateLimit(req, 'signup', SIGNUPS_PER_IP_PER_HOUR, 60 * 60 * 1000);
  const pending = await db.collection('users').where('status', '==', 'pending').count().get();
  if (pending.data().count >= MAX_PENDING) fail('resource-exhausted', 'too-many-pending');
  const loginEmail = `${username.toLowerCase()}@${DOMAIN}`;
  const user = await createAuthUser(loginEmail, password);
  try {
    await db.doc(`users/${user.uid}`).set({
      uid: user.uid, username, email, loginEmail, role: 'client', status: 'pending', createdAt: Date.now(),
      ...(fullName ? { fullName } : {}),
      ...(/^\d{6,15}$/.test(contactPhone) ? { phone: contactPhone } : {}),
    });
  } catch (e) {
    await auth.deleteUser(user.uid).catch(() => {});
    throw e;
  }
  await audit(req, 'account-requested', loginEmail, `Sign-up request "${username}"${fullName ? ` (${fullName})` : ''}, contact ${email} - awaiting approval`);
  return { ok: true };
});

// Admin panel "Add client": create an approved client without signing the admin out.
export const adminCreateClient = onCall(async (req) => {
  const admin = await requireAdmin(req);
  const type = req.data?.type === 'phone' ? 'phone' : 'email';
  const fullName = text(req.data?.fullName, 120);
  const password = req.data?.password;
  if (!fullName) fail('invalid-argument', 'name-required');
  requirePassword(password);
  let authEmail, username, email = null, phone = null;
  if (type === 'phone') {
    phone = text(req.data?.phone, 30);
    const digits = normPhone(phone);
    if (!/^\d{6,15}$/.test(digits)) fail('invalid-argument', 'bad-phone');
    authEmail = `${digits}@${DOMAIN}`;
    phone = digits;
    username = digits;
  } else {
    email = text(req.data?.email, 200).toLowerCase();
    if (!EMAIL.test(email)) fail('invalid-argument', 'bad-email');
    authEmail = email;
    username = email;
  }
  const user = await createAuthUser(authEmail, password, fullName);
  try {
    await db.doc(`users/${user.uid}`).set({
      uid: user.uid, username, email, phone, fullName, role: 'client', status: 'approved',
      loginType: type, createdAt: Date.now(), createdBy: admin.email,
    });
  } catch (e) {
    await auth.deleteUser(user.uid).catch(() => {});
    throw e;
  }
  await audit(req, 'account-created', admin.email, `Admin created client ${authEmail}`);
  return { uid: user.uid };
});
