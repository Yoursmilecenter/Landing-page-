// Firestore rules tests. Run: cd tests/rules && npm i && npm test   (needs Java for the emulator)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, query, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'smile-test',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
});

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok   ', name); }
  catch (e) { fail++; console.log('  FAIL ', name, '\n        ', String(e.message || e).split('\n')[0]); }
};

// ---------- seed (rules bypassed) ----------
await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/admin'), { uid: 'admin', role: 'admin' });                 // legacy: no status field
  await setDoc(doc(db, 'users/des'), { uid: 'des', role: 'designer' });
  await setDoc(doc(db, 'users/cli'), { uid: 'cli', role: 'client', status: 'approved' });
  await setDoc(doc(db, 'users/legacy'), { uid: 'legacy', role: 'client' });              // pre-approval client
  await setDoc(doc(db, 'users/pend'), { uid: 'pend', role: 'client', status: 'pending' });
  await setDoc(doc(db, 'users/rej'), { uid: 'rej', role: 'client', status: 'rejected' });
  await setDoc(doc(db, 'projects/p1'), { title: 'Case', clientEmail: 'cli@x.com', status: 'awaiting-client-approval', assignedDesignerEmail: 'des@x.com', htmlApproved: false });
  await setDoc(doc(db, 'projects/p2'), { title: 'Other', clientEmail: 'other@x.com', status: 'pending', assignedDesignerEmail: null });
  await setDoc(doc(db, 'invites/giftA'), { type: 'mystery', phone: '050', prize: 'teeth_6', status: 'sealed', used: false });
  await setDoc(doc(db, 'invites/phoneB'), { phone: '052', used: false });
  await setDoc(doc(db, 'invites/usedC'), { phone: '053', used: true });
  await setDoc(doc(db, 'counters/projects'), { next: 5 });
  await setDoc(doc(db, 'landing-samples/s1'), { name: 'Sample', url: 'https://x' });
});

const as = (uid, email) => env.authenticatedContext(uid, email ? { email } : {}).firestore();
const anon = (uid) => env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
const nobody = env.unauthenticatedContext().firestore();
const admin = as('admin', 'admin@smile.com');
const des = as('des', 'des@x.com');
const cli = as('cli', 'cli@x.com');
const legacy = as('legacy', 'legacy@x.com');
const pend = as('pend', 'pend@x.com');
const rej = as('rej', 'rej@x.com');

const newCase = (o = {}) => ({ title: 'New', clientEmail: 'cli@x.com', description: 'd', status: 'pending',
  assignedDesignerEmail: null, htmlApproved: false, clientRemarks: null, createdAt: 1, patientId: 'x', projectNo: 5, ...o });

console.log('\n== self sign-up / approval');
await t('new user registers as pending', () => assertSucceeds(setDoc(doc(as('n1', 'n1@x.com'), 'users/n1'), { uid: 'n1', role: 'client', status: 'pending' })));
await t('new user cannot register as approved', () => assertFails(setDoc(doc(as('n2', 'n2@x.com'), 'users/n2'), { uid: 'n2', role: 'client', status: 'approved' })));
await t('new user cannot register without a status', () => assertFails(setDoc(doc(as('n3', 'n3@x.com'), 'users/n3'), { uid: 'n3', role: 'client' })));
await t('new user cannot register as admin', () => assertFails(setDoc(doc(as('n4', 'n4@x.com'), 'users/n4'), { uid: 'n4', role: 'admin', status: 'pending' })));
await t('pending signup cannot carry a prize', () => assertFails(setDoc(doc(as('n5', 'n5@x.com'), 'users/n5'), { uid: 'n5', role: 'client', status: 'pending', prize: 'teeth_6' })));
await t('cannot create someone else\'s profile', () => assertFails(setDoc(doc(as('n6'), 'users/zzz'), { uid: 'zzz', role: 'client', status: 'pending' })));
await t('pending user cannot self-approve', () => assertFails(updateDoc(doc(pend, 'users/pend'), { status: 'approved' })));
await t('rejected user cannot un-reject', () => assertFails(updateDoc(doc(rej, 'users/rej'), { status: 'approved' })));
await t('approved user cannot change own role', () => assertFails(updateDoc(doc(cli, 'users/cli'), { role: 'admin' })));
await t('approved user can edit harmless own fields', () => assertSucceeds(updateDoc(doc(cli, 'users/cli'), { fullName: 'Dr X' })));
await t('admin lists pending users', () => assertSucceeds(getDocs(query(collection(admin, 'users'), where('status', '==', 'pending')))));
await t('client cannot list users', () => assertFails(getDocs(query(collection(cli, 'users'), where('status', '==', 'pending')))));
await t('admin approves a user', () => assertSucceeds(updateDoc(doc(admin, 'users/pend'), { status: 'approved', approvedBy: 'admin@smile.com' })));
await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'users/pend'), { uid: 'pend', role: 'client', status: 'pending' }));
await t('admin creates a client profile for someone else', () => assertSucceeds(setDoc(doc(admin, 'users/made'), { uid: 'made', role: 'client', status: 'approved' })));

console.log('\n== invite / gift onboarding');
await t('gift: anon user creates approved profile with matching prize', () => assertSucceeds(setDoc(doc(anon('g1'), 'users/g1'), { uid: 'g1', role: 'client', status: 'approved', inviteCode: 'giftA', prize: 'teeth_6', loginType: 'gift' })));
await t('gift: wrong prize rejected', () => assertFails(setDoc(doc(anon('g2'), 'users/g2'), { uid: 'g2', role: 'client', status: 'approved', inviteCode: 'giftA', prize: 'teeth_9' })));
await t('gift: missing prize rejected', () => assertFails(setDoc(doc(anon('g3'), 'users/g3'), { uid: 'g3', role: 'client', status: 'approved', inviteCode: 'giftA' })));
await t('gift: anon user marks invite opened', () => assertSucceeds(updateDoc(doc(anon('g1'), 'invites/giftA'), { status: 'opened', openedAt: 1, uid: 'g1' })));
await t('gift: cannot set invite status to markup', () => assertFails(updateDoc(doc(anon('g1'), 'invites/giftA'), { status: '<img src=x>' })));
await t('phone invite: approved profile with no prize', () => assertSucceeds(setDoc(doc(as('ph', '052@smilecenter.pro'), 'users/ph'), { uid: 'ph', role: 'client', status: 'approved', inviteCode: 'phoneB' })));
await t('phone invite: user marks it used', () => assertSucceeds(updateDoc(doc(as('ph', '052@smilecenter.pro'), 'invites/phoneB'), { used: true, usedAt: 1 })));
await t('used invite cannot back a new profile', () => assertFails(setDoc(doc(as('u2'), 'users/u2'), { uid: 'u2', role: 'client', status: 'approved', inviteCode: 'usedC' })));
await t('forged invite code rejected', () => assertFails(setDoc(doc(as('u3'), 'users/u3'), { uid: 'u3', role: 'client', status: 'approved', inviteCode: 'nope' })));
await t('anyone can read an invite by id (link check)', () => assertSucceeds(getDoc(doc(nobody, 'invites/giftA'))));
await t('non-admin cannot list invites', () => assertFails(getDocs(collection(cli, 'invites'))));
await t('client claims gift prize matching its invite', () => assertSucceeds(updateDoc(doc(legacy, 'users/legacy'), { prize: 'teeth_6', giftUsed: false, inviteCode: 'giftA' })));
await t('client cannot forge a prize', () => assertFails(updateDoc(doc(cli, 'users/cli'), { prize: 'teeth_99' })));
await t('client marks its gift used', () => assertSucceeds(updateDoc(doc(legacy, 'users/legacy'), { giftUsed: true, giftUsedAt: 2 })));

console.log('\n== projects: access');
await t('pending user cannot read projects', () => assertFails(getDoc(doc(pend, 'projects/p1'))));
await t('rejected user cannot read projects', () => assertFails(getDoc(doc(rej, 'projects/p1'))));
await t('client reads own project', () => assertSucceeds(getDoc(doc(cli, 'projects/p1'))));
await t('client cannot read another client\'s project', () => assertFails(getDoc(doc(cli, 'projects/p2'))));
await t('designer reads assigned project', () => assertSucceeds(getDoc(doc(des, 'projects/p1'))));
await t('designer cannot read unassigned project', () => assertFails(getDoc(doc(des, 'projects/p2'))));
await t('legacy client (no status) still works', () => assertSucceeds(setDoc(doc(legacy, 'projects/l1'), newCase({ clientEmail: 'legacy@x.com' }))));
await t('admin reads everything', () => assertSucceeds(getDoc(doc(admin, 'projects/p2'))));

console.log('\n== projects: client create');
await t('client creates a normal case', () => assertSucceeds(setDoc(doc(cli, 'projects/c1'), newCase())));
await t('client creates case with gift teeth', () => assertSucceeds(setDoc(doc(cli, 'projects/c2'), newCase({ giftTeeth: 6 }))));
await t('client cannot open case for someone else', () => assertFails(setDoc(doc(cli, 'projects/c3'), newCase({ clientEmail: 'other@x.com' }))));
await t('client cannot self-assign a designer', () => assertFails(setDoc(doc(cli, 'projects/c4'), newCase({ assignedDesignerEmail: 'des@x.com' }))));
await t('client cannot self-flag VIP', () => assertFails(setDoc(doc(cli, 'projects/c5'), newCase({ isVIP: true }))));
await t('client cannot create pre-approved case', () => assertFails(setDoc(doc(cli, 'projects/c6'), newCase({ status: 'approved' }))));
await t('giftTeeth must be a number', () => assertFails(setDoc(doc(cli, 'projects/c7'), newCase({ giftTeeth: '<img src=x onerror=alert(1)>' }))));
await t('projectNo must be a number', () => assertFails(setDoc(doc(cli, 'projects/c8'), newCase({ projectNo: '"><script>' }))));
await t('title capped at 200 chars', () => assertFails(setDoc(doc(cli, 'projects/c9'), newCase({ title: 'x'.repeat(201) }))));

console.log('\n== projects: client update');
await t('client approves design', () => assertSucceeds(updateDoc(doc(cli, 'projects/p1'), { status: 'approved', htmlApproved: true, approvedAt: 1 })));
await t('client requests changes with remarks', () => assertSucceeds(updateDoc(doc(cli, 'projects/p1'), { status: 'changes-requested', htmlApproved: false, clientRemarks: 'smaller', remarksAt: 1 })));
await t('client cannot set arbitrary status', () => assertFails(updateDoc(doc(cli, 'projects/p1'), { status: 'x" onmouseover="alert(1)' })));
await t('htmlApproved must be boolean', () => assertFails(updateDoc(doc(cli, 'projects/p1'), { htmlApproved: 'true);alert(1);//' })));
await t('client cannot reassign designer', () => assertFails(updateDoc(doc(cli, 'projects/p1'), { assignedDesignerEmail: 'evil@x.com' })));
await t('client soft-deletes own case', () => assertSucceeds(updateDoc(doc(cli, 'projects/p1'), { clientDeleted: true, clientDeletedAt: 1 })));

console.log('\n== projects: designer update');
await t('designer sends design for approval', () => assertSucceeds(updateDoc(doc(des, 'projects/p1'), { status: 'awaiting-client-approval', htmlApproved: false })));
await t('designer marks STL ready', () => assertSucceeds(updateDoc(doc(des, 'projects/p1'), { status: 'stl-ready' })));
await t('designer cannot mark completed', () => assertFails(updateDoc(doc(des, 'projects/p1'), { status: 'completed' })));
await t('designer cannot change client', () => assertFails(updateDoc(doc(des, 'projects/p1'), { clientEmail: 'x@x.com' })));
await t('designer cannot touch unassigned case', () => assertFails(updateDoc(doc(des, 'projects/p2'), { status: 'stl-ready' })));

console.log('\n== audit logs / counters / samples');
const log = (o = {}) => ({ eventType: 'login', userEmail: 'cli@x.com', details: 'x', ipAddress: null, timestamp: 1, userAgent: 'ua', ...o });
await t('client writes own audit event', () => assertSucceeds(addDoc(collection(cli, 'auditLogs'), log())));
await t('client cannot write audit event as admin', () => assertFails(addDoc(collection(cli, 'auditLogs'), log({ userEmail: 'admin@smile.com' }))));
await t('pending user cannot write audit events', () => assertFails(addDoc(collection(pend, 'auditLogs'), log({ userEmail: 'pend@x.com' }))));
await t('audit event cannot carry extra fields', () => assertFails(addDoc(collection(cli, 'auditLogs'), log({ evil: 1 }))));
await t('client cannot read audit logs', () => assertFails(getDocs(collection(cli, 'auditLogs'))));
await t('admin reads audit logs', () => assertSucceeds(getDocs(collection(admin, 'auditLogs'))));
await t('client bumps project counter by one', () => assertSucceeds(setDoc(doc(cli, 'counters/projects'), { next: 6 })));
await t('client cannot jump the counter', () => assertFails(setDoc(doc(cli, 'counters/projects'), { next: 100 })));
await t('pending user cannot read counter', () => assertFails(getDoc(doc(pend, 'counters/projects'))));
await t('public reads landing samples', () => assertSucceeds(getDoc(doc(nobody, 'landing-samples/s1'))));
await t('client cannot write landing samples', () => assertFails(setDoc(doc(cli, 'landing-samples/s2'), { name: 'x' })));
await t('admin writes landing samples', () => assertSucceeds(setDoc(doc(admin, 'landing-samples/s2'), { name: 'x' })));

console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
