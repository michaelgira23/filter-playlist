// We can disable because this isn't being deployed to the Firebase functions--they should only be devDependencies
// tslint:disable: no-implicit-dependencies
import * as firebase from '@firebase/testing';
import * as fs from 'fs';
import { suite, test } from '@testdeck/mocha';
// tslint:enable: no-implicit-dependencies

/*
 * ============
 *    Setup
 * ============
 */
const projectId = 'filter-playlist';
const coverageUrl = `http://localhost:8080/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync('../firestore.rules', 'utf8');

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth the object to use for authentication (typically {uid: some-uid})
 * @return {object} the app.
 */
function authedApp(auth: object | null) {
	return firebase
		.initializeTestApp({ projectId, auth: auth! })
		.firestore();
}

/*
 * ============
 *  Test Cases
 * ============
 */
before(async () => {
	await firebase.loadFirestoreRules({ projectId, rules });
});

beforeEach(async () => {
	// Clear the database between tests
	await firebase.clearFirestoreData({ projectId });
});

after(async () => {
	await Promise.all(firebase.apps().map(app => app.delete()));
	console.log(`View rule coverage information at ${coverageUrl}\n`);
});

@suite
export class FilterPlaylists {

	@test
	async 'requires playlist to have createdBy property'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylist.set({
			originId: 'abc'
		}));
	}

	@test
	async 'requires playlist to have originId property'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylist.set({
			createdBy: auth.uid
		}));
	}

	@test
	async 'allows users to create a playlist for themself'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');
		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));
	}

	@test
	async 'does not allow unathenticated people to create a playlist'() {
		const auth = null;
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylist.set({
			createdBy: auth,
			originId: 'abc'
		}));
	}

	@test
	async 'does not allow athenticated people to create a playlist under a different name'() {
		const auth = { uid: 'Bill' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylist.set({
			createdBy: 'Will',
			originId: 'abc'
		}));
	}

}
