// End-to-end tests: browser SDK -> Cloud Functions -> Firestore, all in emulators.
// Run: cd tests && npm i && npm run test:functions   (needs Java). Equivalent from the repo root:
//   npx firebase emulators:exec --only auth,firestore,functions --project demo-smile "node tests/functions/functions.test.mjs"
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword, signInAnonymously, signOut,
         linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { initializeApp as adminApp } from 'firebase-admin/app';
import { getFirestore as adminDb } from 'firebase-admin/firestore';
import { getAuth as adminAuth } from 'firebase-admin/auth';

const PROJECT = 'demo-smile';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
adminApp({ projectId: PROJECT });
const A = adminDb();
const AA = adminAuth();

const app = initializeApp({ apiKey: 'demo-key', projectId: PROJECT, authDomain: `${PROJECT}.firebaseapp.com` });
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
const fns = getFunctions(app, 'europe-west1');
connectFunctionsEmulator(fns, '127.0.0.1', 5001);
const call = (name, data) => httpsCallable(fns, name)(data).then(r => r.data);

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok   ', name); }
  catch (e) { fail++; console.log('  FAIL ', name, '\n         ', e.code || '', e.message); }
};
const expectErr = async (p, code, reason) => {
  try { await p; } catch (e) {
    if (e.code !== `functions/${code}` || (reason && e.message !== reason)) throw new Error(`got ${e.code} "${e.message}", want functions/${code} "${reason}"`);
    return;
  }
  throw new Error(`expected functions/${code} ${reason || ''}, call succeeded`);
};
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`); };
const PW = 'Correct-Horse-9';
const DAY = 86400000;

// ---------- seed ----------
const adminUser = await AA.createUser({ email: 'admin@smile.com', password: PW });
await A.doc(`users/${adminUser.uid}`).set({ uid: adminUser.uid, role: 'admin' });
await A.doc('invites/phone1').set({ phone: '0521234567', used: false, createdAt: Date.now() });
await A.doc('invites/gift1').set({ type: 'mystery', phone: '0509999999', clientName: 'Cohen', isDoctor: true, prize: 'teeth_7', status: 'sealed', used: false, expiresAt: Date.now() + 7 * DAY });
await A.doc('invites/gift2').set({ type: 'mystery', phone: '0508888888', clientName: 'Levi', prize: 'teeth_5', status: 'sealed', used: false, expiresAt: Date.now() + 7 * DAY });
await A.doc('invites/gift3').set({ type: 'mystery', phone: '0507777777', prize: 'teeth_8', status: 'sealed', used: false, expiresAt: Date.now() + 7 * DAY });
await A.doc('invites/expired').set({ type: 'mystery', phone: '0501111111', prize: 'teeth_5', status: 'sealed', used: false, expiresAt: Date.now() - DAY });

console.log('\n== public sign-up (requestAccess)');
await t('creates a pending account', async () => {
  eq((await call('requestAccess', { username: 'drlevi', email: 'levi@clinic.co.il', password: PW })).ok, true, 'ok');
  const u = (await AA.getUserByEmail('drlevi@smilecenter.pro'));
  const d = (await A.doc(`users/${u.uid}`).get()).data();
  eq(d.status, 'pending', 'status'); eq(d.role, 'client', 'role');
});
await t('pending account can sign in but sees no projects', async () => {
  await signInWithEmailAndPassword(auth, 'drlevi@smilecenter.pro', PW);
  let denied = false; try { await getDocs(collection(db, 'projects')); } catch { denied = true; }
  eq(denied, true, 'projects denied'); await signOut(auth);
});
await t('duplicate username rejected', () => expectErr(call('requestAccess', { username: 'drlevi', email: 'x@y.co', password: PW }), 'already-exists', 'account-exists'));
await t('phone-number username rejected (reserved for invites)', () => expectErr(call('requestAccess', { username: '0521234567', email: 'x@y.co', password: PW }), 'invalid-argument', 'bad-username'));
await t('short password rejected', () => expectErr(call('requestAccess', { username: 'drcohen', email: 'c@y.co', password: 'short' }), 'invalid-argument', 'weak-password'));
await t('bad email rejected', () => expectErr(call('requestAccess', { username: 'drcohen', email: 'nope', password: PW }), 'invalid-argument', 'bad-email'));

console.log('\n== admin "Add client" (adminCreateClient)');
await t('anonymous caller refused', () => expectErr(call('adminCreateClient', { type: 'email', email: 'a@b.co', fullName: 'A', password: PW }), 'unauthenticated'));
await t('client caller refused', async () => {
  const u = await AA.createUser({ email: 'plain@x.co', password: PW });
  await A.doc(`users/${u.uid}`).set({ uid: u.uid, role: 'client', status: 'approved' });
  await signInWithEmailAndPassword(auth, 'plain@x.co', PW);
  await expectErr(call('adminCreateClient', { type: 'email', email: 'a@b.co', fullName: 'A', password: PW }), 'permission-denied', 'admin-only');
  await signOut(auth);
});
await t('admin creates an approved email client', async () => {
  await signInWithEmailAndPassword(auth, 'admin@smile.com', PW);
  const { uid } = await call('adminCreateClient', { type: 'email', email: 'Dr.Mizrahi@Clinic.co.il', fullName: 'Dr Mizrahi', password: PW });
  const d = (await A.doc(`users/${uid}`).get()).data();
  eq(d.status, 'approved', 'status'); eq(d.email, 'dr.mizrahi@clinic.co.il', 'email'); eq(d.createdBy, 'admin@smile.com', 'createdBy');
});
await t('admin creates a phone client', async () => {
  const { uid } = await call('adminCreateClient', { type: 'phone', phone: '+972 50 123 4567', fullName: 'Dr Phone', password: PW });
  eq((await AA.getUser(uid)).email, '972501234567@smilecenter.pro', 'auth email');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, '972501234567@smilecenter.pro', PW); await signOut(auth);
});

console.log('\n== phone invite link (checkInvite + registerWithInvite)');
await t('checkInvite shows the invited phone', async () => { const r = await call('checkInvite', { code: 'phone1' }); eq(r.type, 'phone', 'type'); eq(r.phone, '0521234567', 'phone'); });
await t('unknown code rejected', () => expectErr(call('checkInvite', { code: 'nope' }), 'not-found', 'invalid'));
await t('weak password rejected, invite untouched', async () => {
  await expectErr(call('registerWithInvite', { code: 'phone1', password: '123' }), 'invalid-argument', 'weak-password');
  eq((await A.doc('invites/phone1').get()).data().used, false, 'used');
});
await t('registers, signs in, invite closed', async () => {
  const { email } = await call('registerWithInvite', { code: 'phone1', password: PW });
  eq(email, '0521234567@smilecenter.pro', 'email');
  const cred = await signInWithEmailAndPassword(auth, email, PW);
  eq((await getDoc(doc(db, 'users', cred.user.uid))).data().status, 'approved', 'status');
  eq((await A.doc('invites/phone1').get()).data().used, true, 'used'); await signOut(auth);
});
await t('used invite cannot register twice', () => expectErr(call('registerWithInvite', { code: 'phone1', password: PW }), 'failed-precondition', 'used'));
await t('checkInvite reports used', () => expectErr(call('checkInvite', { code: 'phone1' }), 'failed-precondition', 'used'));
await t('gift code cannot be used as phone invite', () => expectErr(call('registerWithInvite', { code: 'gift1', password: PW }), 'not-found', 'invalid'));

console.log('\n== gift link (checkInvite + redeemGift + claimGift)');
await t('checkInvite reveals name and teeth only', async () => {
  const r = await call('checkInvite', { code: 'gift1' });
  eq(r.type, 'mystery', 'type'); eq(r.teeth, 7, 'teeth'); eq(r.clientName, 'Cohen', 'name'); eq(r.prize, undefined, 'raw prize hidden'); eq(r.phone, undefined, 'phone hidden');
});
await t('expired gift rejected', () => expectErr(call('checkInvite', { code: 'expired' }), 'failed-precondition', 'expired'));
await t('redeemGift needs a signed-in visitor', () => expectErr(call('redeemGift', { code: 'gift1' }), 'unauthenticated'));
let giftUid;
await t('anonymous visitor redeems: approved client with the invite prize', async () => {
  giftUid = (await signInAnonymously(auth)).user.uid;
  await call('redeemGift', { code: 'gift1' });
  const d = (await getDoc(doc(db, 'users', giftUid))).data();
  eq(d.status, 'approved', 'status'); eq(d.prize, 'teeth_7', 'prize'); eq(d.needsPassword, true, 'needsPassword');
  eq((await A.doc('invites/gift1').get()).data().status, 'opened', 'invite status');
});
await t('redeeming again from the same visitor is harmless', () => call('redeemGift', { code: 'gift1' }));
await t('claimGift refused while still anonymous', () => expectErr(call('claimGift', { code: 'gift1' }), 'failed-precondition', 'set-password-first'));
await t('visitor sets a password, claimGift closes the invite', async () => {
  await linkWithCredential(auth.currentUser, EmailAuthProvider.credential('0509999999@smilecenter.pro', PW));
  await auth.currentUser.getIdToken(true);
  const r = await call('claimGift', { code: 'gift1' });
  eq(r.ok, true, 'ok'); eq(r.attached, false, 'attached');
  const inv = (await A.doc('invites/gift1').get()).data();
  eq(inv.status, 'redeemed', 'status'); eq(inv.used, true, 'used');
  eq((await A.doc(`users/${giftUid}`).get()).data().prize, 'teeth_7', 'prize kept');
});
await t('claiming the same gift again is idempotent', () => call('claimGift', { code: 'gift1' }));
await t('redeemed gift link is closed', () => expectErr(call('checkInvite', { code: 'gift1' }), 'failed-precondition', 'redeemed'));
await signOut(auth);

await t('existing client attaches a new gift to their account', async () => {
  await signInWithEmailAndPassword(auth, 'dr.mizrahi@clinic.co.il', PW);
  const r = await call('claimGift', { code: 'gift2' });
  eq(r.attached, true, 'attached');
  const d = (await getDoc(doc(db, 'users', auth.currentUser.uid))).data();
  eq(d.prize, 'teeth_5', 'prize'); eq(d.giftUsed, false, 'giftUsed');
});
await t('second gift refused while the first is unspent (invite not burned)', async () => {
  await expectErr(call('claimGift', { code: 'gift3' }), 'failed-precondition', 'already-has-gift');
  eq((await A.doc('invites/gift3').get()).data().used, false, 'gift3 still open');
});
await t('after spending the gift, a new one can be attached', async () => {
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', auth.currentUser.uid), { giftUsed: true, giftUsedAt: Date.now() });
  eq((await call('claimGift', { code: 'gift3' })).attached, true, 'attached');
  eq((await getDoc(doc(db, 'users', auth.currentUser.uid))).data().prize, 'teeth_8', 'prize');
});
await signOut(auth);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
