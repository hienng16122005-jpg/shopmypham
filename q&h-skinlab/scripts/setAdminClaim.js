#!/usr/bin/env node
const admin = require('firebase-admin');
require('dotenv').config();

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : '';
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase env. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
  }

  const uidArg = getArg('uid');
  const emailArg = getArg('email');

  if (!uidArg && !emailArg) {
    throw new Error('Please provide --uid=<firebase_uid> or --email=<account_email>.');
  }

  const auth = admin.auth();
  const userRecord = uidArg ? await auth.getUser(uidArg) : await auth.getUserByEmail(emailArg);
  const uid = userRecord.uid;

  const currentClaims = userRecord.customClaims || {};
  await auth.setCustomUserClaims(uid, { ...currentClaims, admin: true, isAdmin: true });

  // Also update Firestore users collection
  const db = admin.firestore();
  await db.collection('users').doc(uid).set({
    role: 'Quản trị viên',
    email: userRecord.email,
    name: userRecord.displayName || 'Admin',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log(`Admin claim and Firestore role set successfully for uid: ${uid}`);
  console.log('User needs to sign out and sign in again to receive new token.');
}

main().catch((error) => {
  console.error('Failed to set admin claim:', error.message);
  process.exit(1);
});

