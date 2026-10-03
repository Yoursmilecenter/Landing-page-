// Storage rules tests (cross-service: rules read users/projects from Firestore).
// Run: cd tests && npm run test:storage   (needs Java for the emulators)
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getBytes, deleteObject } from 'firebase/storage';

const env = await initializeTestEnvironment({
  projectId: 'smile-test',
  firestore: { rules: 'rules_version = "2"; service cloud.firestore { match /{d=**} { allow read, write: if false; } }', host: '127.0.0.1', port: 8085 },
  storage: { rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 9199 },
});

let pass = 0, fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('  ok   ', name); }
  catch (e) { fail++; console.log('  FAIL ', name, '\n        ', String(e.message || e).split('\n')[0]); }
};

await env.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'users/admin'), { uid: 'admin', role: 'admin' });
  await setDoc(doc(db, 'users/des'), { uid: 'des', role: 'designer' });
  await setDoc(doc(db, 'users/des2'), { uid: 'des2', role: 'designer' });
  await setDoc(doc(db, 'users/cli'), { uid: 'cli', role: 'client', status: 'approved' });
  await setDoc(doc(db, 'users/legacy'), { uid: 'legacy', role: 'client' });
  await setDoc(doc(db, 'users/pend'), { uid: 'pend', role: 'client', status: 'pending' });
  await setDoc(doc(db, 'users/rej'), { uid: 'rej', role: 'client', status: 'rejected' });
  await setDoc(doc(db, 'projects/p1'), { clientEmail: 'cli@x.com', assignedDesignerEmail: 'des@x.com' });
  await setDoc(doc(db, 'projects/p2'), { clientEmail: 'other@x.com', assignedDesignerEmail: null });
  await setDoc(doc(db, 'projects/pp'), { clientEmail: 'pend@x.com', assignedDesignerEmail: null });
  await setDoc(doc(db, 'projects/pl'), { clientEmail: 'legacy@x.com', assignedDesignerEmail: null });
  const st = ctx.storage();
  await uploadString(ref(st, 'projects/p1/scan.stl'), 'scan');
  await uploadString(ref(st, 'projects/p1/Case.html'), '<h1>d</h1>', 'raw', { customMetadata: { by: 'staff' } });
  await uploadString(ref(st, 'projects/pp/scan.stl'), 'scan');
  await uploadString(ref(st, 'landing-samples/s.html'), 'x');
});

const as = (uid, email) => env.authenticatedContext(uid, email ? { email } : {}).storage();
const admin = as('admin', 'admin@smile.com'), des = as('des', 'des@x.com'), des2 = as('des2', 'des2@x.com');
const cli = as('cli', 'cli@x.com'), legacy = as('legacy', 'legacy@x.com'), pend = as('pend', 'pend@x.com'), rej = as('rej', 'rej@x.com');
const nobody = env.unauthenticatedContext().storage();
const noProfile = as('ghost', 'cli@x.com');

console.log('\n== project files');
await t('client reads own project file', () => assertSucceeds(getBytes(ref(cli, 'projects/p1/scan.stl'))));
await t('legacy client (no status) uploads to own project', () => assertSucceeds(uploadString(ref(legacy, 'projects/pl/a.stl'), 'a')));
await t('client cannot read another project', () => assertFails(getBytes(ref(cli, 'projects/p2/x.stl'))));
await t('assigned designer reads', () => assertSucceeds(getBytes(ref(des, 'projects/p1/scan.stl'))));
await t('other designer cannot read', () => assertFails(getBytes(ref(des2, 'projects/p1/scan.stl'))));
await t('admin reads anything', () => assertSucceeds(getBytes(ref(admin, 'projects/p1/scan.stl'))));
await t('pending user cannot read own project file', () => assertFails(getBytes(ref(pend, 'projects/pp/scan.stl'))));
await t('pending user cannot upload', () => assertFails(uploadString(ref(pend, 'projects/pp/new.stl'), 'x')));
await t('rejected user cannot upload', () => assertFails(uploadString(ref(rej, 'projects/pp/new.stl'), 'x')));
await t('signed in without profile denied (same email as client)', () => assertFails(getBytes(ref(noProfile, 'projects/p1/scan.stl'))));
await t('anonymous visitor denied', () => assertFails(getBytes(ref(nobody, 'projects/p1/scan.stl'))));

console.log('\n== overwrite protection');
await t('client uploads a new scan', () => assertSucceeds(uploadString(ref(cli, 'projects/p1/scan2.stl'), 'x')));
await t('client replaces own scan', () => assertSucceeds(uploadString(ref(cli, 'projects/p1/scan.stl'), 'v2')));
await t('client cannot overwrite staff design', () => assertFails(uploadString(ref(cli, 'projects/p1/Case.html'), 'hacked')));
await t('client cannot label own upload as staff', () => assertFails(uploadString(ref(cli, 'projects/p1/fake.stl'), 'x', 'raw', { customMetadata: { by: 'staff' } })));
await t('designer replaces staff design', () => assertSucceeds(uploadString(ref(des, 'projects/p1/Case.html'), 'v2', 'raw', { customMetadata: { by: 'staff' } })));
await t('designer cannot upload to unassigned project', () => assertFails(uploadString(ref(des, 'projects/p2/x.stl'), 'x')));
await t('client cannot delete', () => assertFails(deleteObject(ref(cli, 'projects/p1/scan2.stl'))));
await t('designer cannot delete', () => assertFails(deleteObject(ref(des, 'projects/p1/scan2.stl'))));
await t('admin deletes', () => assertSucceeds(deleteObject(ref(admin, 'projects/p1/scan2.stl'))));

console.log('\n== landing samples');
await t('anyone reads samples', () => assertSucceeds(getBytes(ref(nobody, 'landing-samples/s.html'))));
await t('client cannot write samples', () => assertFails(uploadString(ref(cli, 'landing-samples/x.html'), 'x')));
await t('admin writes samples', () => assertSucceeds(uploadString(ref(admin, 'landing-samples/x.html'), 'x')));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);