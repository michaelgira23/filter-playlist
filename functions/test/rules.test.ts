// We can disable because this isn't being deployed to the Firebase functions--they should only be devDependencies
// tslint:disable: no-implicit-dependencies
import * as firebase from '@firebase/testing';
import * as fs from 'fs';
import { suite, test, only } from '@testdeck/mocha';
// tslint:enable: no-implicit-dependencies

only;

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

	/**
	 * Creating
	 */

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
	async 'does not allow unathenticated people to create a playlist on behalf of someone else'() {
		const auth = null;
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertFails(filteredPlaylist.set({
			createdBy: 'Billiam',
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

	/**
	 * Reading
	 */

	@test
	async 'allows users to read their playlist'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertSucceeds(filteredPlaylist.get());
	}

	@test
	async 'does not allow users to read other people\'s playlist'() {
		const authBilliam = { uid: 'Billiam' };
		const dbBilliam = authedApp(authBilliam);

		const authWilliam = { uid: 'William' };
		const dbWilliam = authedApp(authWilliam);

		const filteredPlaylistBilliam = dbBilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertSucceeds(filteredPlaylistBilliam.set({
			createdBy: authBilliam.uid,
			originId: 'abc'
		}));

		const filteredPlaylistWilliam = dbWilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylistWilliam.get());
	}

	/**
	 * Updating
	 */

	@test
	async 'allows users to update originId'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertSucceeds(filteredPlaylist.update({
			createdBy: auth.uid,
			originId: '123'
		}));
	}

	@test
	async 'allows users to update by just specifying originId'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertSucceeds(filteredPlaylist.update({
			originId: '123'
		}));
	}

	@test
	async 'does not allow users to update createdBy'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertFails(filteredPlaylist.update({
			createdBy: 'William'
		}));
	}

	@test
	async 'allows users to update both values without changing anything'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertSucceeds(filteredPlaylist.update({
			createdBy: auth.uid,
			originId: 'abc'
		}));
	}

	@test
	async 'does not allow users to update other people\'s playlist'() {
		const authBilliam = { uid: 'Billiam' };
		const dbBilliam = authedApp(authBilliam);

		const authWilliam = { uid: 'William' };
		const dbWilliam = authedApp(authWilliam);

		const filteredPlaylistBilliam = dbBilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertSucceeds(filteredPlaylistBilliam.set({
			createdBy: authBilliam.uid,
			originId: 'abc'
		}));

		const filteredPlaylistWilliam = dbWilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylistWilliam.update({
			originId: '123'
		}));
	}

	/**
	 * Deleting
	 */

	@test
	async 'allows users to delete their playlist'() {
		const auth = { uid: 'Billiam' };
		const db = authedApp(auth);
		const filteredPlaylist = db.collection('filteredPlaylists').doc('123');

		await firebase.assertSucceeds(filteredPlaylist.set({
			createdBy: auth.uid,
			originId: 'abc'
		}));

		await firebase.assertSucceeds(filteredPlaylist.delete());
	}

	@test
	async 'does not allow users to delete other people\'s playlist'() {
		const authBilliam = { uid: 'Billiam' };
		const dbBilliam = authedApp(authBilliam);

		const authWilliam = { uid: 'William' };
		const dbWilliam = authedApp(authWilliam);

		const filteredPlaylistBilliam = dbBilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertSucceeds(filteredPlaylistBilliam.set({
			createdBy: authBilliam.uid,
			originId: 'abc'
		}));

		const filteredPlaylistWilliam = dbWilliam.collection('filteredPlaylists').doc('123');
		await firebase.assertFails(filteredPlaylistWilliam.delete());
	}

}
