// Live end-to-end check of smilecenter.pro against PRODUCTION Firebase.
// Creates throwaway "qa-*" accounts, invites and a project, exercises every flow
// through the same SDK calls the pages make, then deletes exactly the items it created (tracked by id), nothing else.
// Owner access (setup/cleanup only) comes from the logged-in Firebase CLI on this machine.
// Run: cd tests && npm run test:live
import { createRequire } from 'node:module';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously,
         signOut, linkWithCredential, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadString, getBytes, listAll } from 'firebase/storage';

const PROJECT = 'smile-center-7c6f5';
const require = createRequire(import.meta.url);
const FT = `${process.env.APPDATA}/npm/node_modules/firebase-tools/lib/`;
const { requireAuth } = require(FT + 'requireAuth.js');
const apiv2 = require(FT + 'apiv2.js');
const account = require(FT + 'auth.js').getGlobalDefaultAccount();
if (!account) throw new Error('Run "firebase login" first');
await requireAuth({ project: PROJECT, user: account.user, tokens: account.tokens });
const ownerToken = () => apiv2.getAccessToken();

const FS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const IDT = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const owner = async (method, url, body) => {
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${await ownerToken()}`, 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 404) throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(j).slice(0, 200)}`);
  return j;
};
const fsVal = v => typeof v === 'string' ? { stringValue: v } : typeof v === 'boolean' ? { booleanValue: v }
  : Number.isInteger(v) ? { integerValue: String(v) } : v === null ? { nullValue: null } : { doubleValue: v };
const ownerSet = (path, obj) => owner('PATCH', `${FS}/${path}`, { fields: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fsVal(v)])) });
const ownerDel = path => owner('DELETE', `${FS}/${path}`);
const ownerDelUser = uid => owner('POST', `${IDT}/accounts:delete`, { localId: uid });

const cfg = { apiKey: 'AIzaSyBOmZxS75qIodscsge-gHYuUlb2vCvl0ZM', authDomain: `${PROJECT}.firebaseapp.com`, projectId: PROJECT,
  storageBucket: `${PROJECT}.firebasestorage.app`, appId: '1:517098616907:web:6e321d280049cd67c1b5ce' };
let n = 0;
const session = () => { const app = initializeApp(cfg, `s${n++}`); return { app, auth: getAuth(app), db: getFirestore(app),
  call: (name, data) => httpsCallable(getFunctions(app, 'europe-west1'), name)(data).then(r => r.data), st: getStorage(app) }; };

const TS = Date.now().toString(36);
const PW = 'Qa-' + Math.random().toString(36).slice(2) + '-Pw9';
const created = { users: new Set(), docs: new Set(), files: [] };
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ', name); } catch (e) { fail++; console.log('  FAIL ', name, '\n         ', e.code || '', String(e.message).slice(0, 220)); } };
const eq = (a, b, w) => { if (a !== b) throw new Error(`${w}: got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); };
const denied = async p => { try { await p; } catch (e) { if (/permission|PERMISSION|unauthorized|403/.test(e.code + e.message)) return; throw e; } throw new Error('expected permission denied, succeeded'); };
const phoneFor = k => '05' + String(Date.now()).slice(-7) + k;   // unique 10-digit test number

try {
  console.log(`\n== setup (qa-${TS})`);
  const adm = session();
  const admCred = await createUserWithEmailAndPassword(adm.auth, `qa-admin-${TS}@smilecenter.pro`, PW);
  created.users.add(admCred.user.uid);
  await ownerSet(`users/${admCred.user.uid}`, { uid: admCred.user.uid, role: 'admin', status: 'approved', qaTest: true });
  created.docs.add(`users/${admCred.user.uid}`);
  const des = session();
  const desEmail = `qa-designer-${TS}@smilecenter.pro`;
  const desCred = await createUserWithEmailAndPassword(des.auth, desEmail, PW);
  created.users.add(desCred.user.uid);
  await ownerSet(`users/${desCred.user.uid}`, { uid: desCred.user.uid, role: 'designer', status: 'approved', qaTest: true });
  created.docs.add(`users/${desCred.user.uid}`);
  console.log('  test admin + designer ready');

  console.log('\n== 1. public sign-up -> pending -> admin approval');
  const pub = session();
  const reqUser = `qa-req-${TS}`;
  let reqUid;
  await t('requestAccess creates the account', async () => { eq((await pub.call('requestAccess', { username: reqUser, email: `qa-${TS}@example.com`, password: PW, fullName: 'QA Clinic', phone: '050 000 0000' })).ok, true, 'ok'); });
  await t('pending user signs in but profile says pending', async () => {
    const c = await signInWithEmailAndPassword(pub.auth, `${reqUser}@smilecenter.pro`, PW); reqUid = c.user.uid;
    created.users.add(reqUid); created.docs.add(`users/${reqUid}`);
    eq((await getDoc(doc(pub.db, 'users', reqUid))).data().status, 'pending', 'status');
  });
  await t('pending user cannot list projects', () => denied(getDocs(query(collection(pub.db, 'projects'), where('clientEmail', '==', `${reqUser}@smilecenter.pro`)))));
  await t('pending user cannot approve self', () => denied(updateDoc(doc(pub.db, 'users', reqUid), { status: 'approved' })));
  await t('admin sees it in pending list', async () => {
    const s = await getDocs(query(collection(adm.db, 'users'), where('status', '==', 'pending')));
    if (!s.docs.some(d => d.id === reqUid)) throw new Error('not listed');
  });
  await t('server logged the sign-up request (visible to admin)', async () => {
    const s = await getDocs(query(collection(adm.db, 'auditLogs'), where('userEmail', '==', `${reqUser}@smilecenter.pro`)));
    const hit = s.docs.find(d => d.data().eventType === 'account-requested');
    s.docs.forEach(d => created.docs.add(`auditLogs/${d.id}`));
    if (!hit) throw new Error('no account-requested entry');
    if (!/QA Clinic/.test(hit.data().details)) throw new Error('details missing name');
  });
  await t('admin approves', () => updateDoc(doc(adm.db, 'users', reqUid), { status: 'approved', approvedAt: Date.now(), approvedBy: `qa-admin-${TS}@smilecenter.pro` }));

  console.log('\n== 2. approved client: case, upload, designer, approval');
  let pid;
  await t('client opens a case', async () => {
    await pub.auth.currentUser.getIdToken(true);
    const r = doc(collection(pub.db, 'projects')); pid = r.id; created.docs.add(`projects/${pid}`);
    await setDoc(r, { title: `QA ${TS}`, clientEmail: `${reqUser}@smilecenter.pro`, description: 'qa test case', status: 'pending',
      assignedDesignerEmail: null, htmlApproved: false, clientRemarks: null, createdAt: Date.now(), patientId: pid });
  });
  await t('client uploads a scan file', async () => {
    const p = `projects/${pid}/qa-scan.stl`; created.files.push(p);
    await uploadString(ref(pub.st, p), 'solid qa\nendsolid qa\n');
    eq((await listAll(ref(pub.st, `projects/${pid}`))).items.length, 1, 'files');
  });
  await t('client cannot self-flag VIP', () => denied(updateDoc(doc(pub.db, 'projects', pid), { isVIP: true })));
  await t('designer cannot see it before assignment', async () => {
    await signInWithEmailAndPassword(des.auth, desEmail, PW);
    await denied(getDoc(doc(des.db, 'projects', pid)));
  });
  await t('admin assigns the designer', async () => {
    await signInWithEmailAndPassword(adm.auth, `qa-admin-${TS}@smilecenter.pro`, PW);
    await updateDoc(doc(adm.db, 'projects', pid), { assignedDesignerEmail: desEmail, status: 'in-progress' });
  });
  await t('designer reads scan, uploads design, requests approval', async () => {
    await getDoc(doc(des.db, 'projects', pid));
    eq((await getBytes(ref(des.st, `projects/${pid}/qa-scan.stl`))).byteLength > 0, true, 'scan bytes');
    const p = `projects/${pid}/QA ${TS}.html`; created.files.push(p);
    await uploadString(ref(des.st, p), '<!doctype html><p>qa design</p>');
    await updateDoc(doc(des.db, 'projects', pid), { status: 'awaiting-client-approval', htmlApproved: false });
  });
  await t('designer cannot mark completed', () => denied(updateDoc(doc(des.db, 'projects', pid), { status: 'completed' })));
  await t('client approves the design', () => updateDoc(doc(pub.db, 'projects', pid), { status: 'approved', htmlApproved: true, approvedAt: Date.now() }));
  await t('client cannot read another client\'s file area', async () => {
    const other = session(); const c = await createUserWithEmailAndPassword(other.auth, `qa-stranger-${TS}@smilecenter.pro`, PW);
    created.users.add(c.user.uid);
    await denied(getBytes(ref(other.st, `projects/${pid}/qa-scan.stl`)));
    await denied(getDoc(doc(other.db, 'projects', pid)));
    await deleteApp(other.app);
  });

  console.log('\n== 3. admin "Add client"');
  const addPhone = phoneFor('1');
  const addPhoneIntl = '+972 ' + addPhone.slice(1, 3) + '-' + addPhone.slice(3);   // typed the long way
  await t('admin creates a phone client (typed as +972 ...)', async () => {
    const { uid } = await adm.call('adminCreateClient', { type: 'phone', phone: addPhoneIntl, fullName: 'QA Phone Client', password: PW });
    created.users.add(uid); created.docs.add(`users/${uid}`);
  });
  await t('that client signs in with phone + password', async () => {
    const s = session(); const c = await signInWithEmailAndPassword(s.auth, `${addPhone}@smilecenter.pro`, PW);
    eq((await getDoc(doc(s.db, 'users', c.user.uid))).data().status, 'approved', 'status'); await deleteApp(s.app);
  });
  await t('designer cannot use Add client', () => des.call('adminCreateClient', { type: 'phone', phone: phoneFor('2'), fullName: 'x', password: PW })
    .then(() => { throw new Error('designer created a client'); }, e => eq(e.message, 'admin-only', 'reason')));

  console.log('\n== 4. phone invite link');
  const invPhone = phoneFor('3'); const invCode = `qa${TS}inv`;
  await t('admin creates invite', async () => { await setDoc(doc(adm.db, 'invites', invCode), { phone: invPhone, code: invCode, createdBy: 'qa', createdAt: Date.now(), used: false }); created.docs.add(`invites/${invCode}`); });
  const vis = session();
  await t('checkInvite returns the phone', async () => eq((await vis.call('checkInvite', { code: invCode })).phone, invPhone, 'phone'));
  await t('registerWithInvite + sign in', async () => {
    const { email } = await vis.call('registerWithInvite', { code: invCode, password: PW });
    const c = await signInWithEmailAndPassword(vis.auth, email, PW); created.users.add(c.user.uid); created.docs.add(`users/${c.user.uid}`);
    eq((await getDoc(doc(vis.db, 'users', c.user.uid))).data().status, 'approved', 'status');
  });
  await t('invite cannot be reused', () => vis.call('registerWithInvite', { code: invCode, password: PW }).then(() => { throw new Error('reused'); }, e => eq(e.message, 'used', 'reason')));

  console.log('\n== 5. gift link');
  const giftPhone = phoneFor('4'); const giftCode = `qa${TS}gift`;
  await t('admin creates gift', async () => {
    await setDoc(doc(adm.db, 'invites', giftCode), { type: 'mystery', code: giftCode, phone: giftPhone, clientName: 'QA', isDoctor: true,
      prize: 'teeth_6', status: 'sealed', used: false, createdBy: 'qa', createdAt: Date.now(), expiresAt: Date.now() + 864e5 });
    created.docs.add(`invites/${giftCode}`);
  });
  const g = session(); let gUid;
  await t('gift page data: name + 6 teeth', async () => { const r = await g.call('checkInvite', { code: giftCode }); eq(r.teeth, 6, 'teeth'); eq(r.clientName, 'QA', 'name'); });
  await t('guest redeems -> approved client with prize', async () => {
    gUid = (await signInAnonymously(g.auth)).user.uid; created.users.add(gUid); created.docs.add(`users/${gUid}`);
    await g.call('redeemGift', { code: giftCode });
    const d = (await getDoc(doc(g.db, 'users', gUid))).data(); eq(d.prize, 'teeth_6', 'prize'); eq(d.needsPassword, true, 'needsPassword');
  });
  await t('guest sets password, gift claimed, invite closed', async () => {
    await linkWithCredential(g.auth.currentUser, EmailAuthProvider.credential(`${giftPhone}@smilecenter.pro`, PW));
    await updateDoc(doc(g.db, 'users', gUid), { needsPassword: false, email: `${giftPhone}@smilecenter.pro`, passwordSetAt: Date.now() });
    await g.auth.currentUser.getIdToken(true);
    eq((await g.call('claimGift', { code: giftCode })).ok, true, 'ok');
    const inv = (await getDoc(doc(adm.db, 'invites', giftCode))).data(); eq(inv.status, 'redeemed', 'status');
  });
  await t('gift client opens a case using the gift, gift marked used', async () => {
    const r = doc(collection(g.db, 'projects')); created.docs.add(`projects/${r.id}`);
    await setDoc(r, { title: `QA gift ${TS}`, clientEmail: `${giftPhone}@smilecenter.pro`, description: 'qa gift case', status: 'pending',
      assignedDesignerEmail: null, htmlApproved: false, clientRemarks: null, createdAt: Date.now(), patientId: r.id, giftTeeth: 6 });
    await updateDoc(doc(g.db, 'users', gUid), { giftUsed: true, giftUsedAt: Date.now() });
  });
  await t('gift link is now closed', () => g.call('checkInvite', { code: giftCode }).then(() => { throw new Error('still open'); }, e => eq(e.message, 'redeemed', 'reason')));
  await t('client cannot grant itself another prize', () => denied(updateDoc(doc(g.db, 'users', gUid), { prize: 'teeth_99', giftUsed: false })));

  console.log('\n== audit trail');
  await t('server logged account and gift events for this run', async () => {
    const emails = [`qa-admin-${TS}@smilecenter.pro`, `${invPhone}@smilecenter.pro`, `${giftPhone}@smilecenter.pro`, `${reqUser}@smilecenter.pro`];
    const byEmail = await getDocs(query(collection(adm.db, 'auditLogs'), where('userEmail', 'in', emails)));
    const opened = (await getDocs(query(collection(adm.db, 'auditLogs'), where('eventType', '==', 'gift-opened'))))
      .docs.filter(d => String(d.data().details).includes(giftCode.slice(0, 6)));
    const mine = [...byEmail.docs, ...opened];
    mine.forEach(d => created.docs.add(`auditLogs/${d.id}`));          // remove this run's log lines afterwards
    const types = new Set(mine.map(d => d.data().eventType));
    for (const ty of ['account-requested', 'account-created', 'gift-opened', 'gift-redeemed'])
      if (!types.has(ty)) throw new Error(`missing ${ty} (have ${[...types].join(', ')})`);
  });
} finally {
  console.log('\n== cleanup');
  for (const p of created.files) await owner('DELETE', `https://firebasestorage.googleapis.com/v0/b/${PROJECT}.firebasestorage.app/o/${encodeURIComponent(p)}`).catch(e => console.log('  file', p, e.message));
  for (const d of created.docs) await ownerDel(d).catch(e => console.log('  doc', d, e.message));
  for (const u of created.users) await ownerDelUser(u).catch(e => console.log('  user', u, e.message));
  console.log(`  removed ${created.files.length} files, ${created.docs.size} docs, ${created.users.size} accounts`);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
