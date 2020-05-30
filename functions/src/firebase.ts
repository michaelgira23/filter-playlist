import firebaseAdmin from 'firebase-admin';

import serviceAccount from '../service-account.json';

// Firebase service account for querying database
export const admin = firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(serviceAccount as any),
	databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
});
