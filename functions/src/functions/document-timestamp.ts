import _ from 'lodash';
import * as functions from 'firebase-functions';

/**
 * Add `createdAt` property on all documents
 */
export const filteredPlaylistsCreatedAt = functions.firestore
	.document('filteredPlaylists/{documentId}')
	.onCreate((snap, context) => {
		return snap.ref.set(
			{ createdAt: snap.createTime?.toMillis() },
			{ merge: true }
		).catch(error => {
			console.error(error);
			return false;
		});
	});

export const spotifyCredentialsCreatedAt = functions.firestore
	.document('spotifyCredentials/{documentId}')
	.onCreate((snap, context) => {
		return snap.ref.set(
			{ createdAt: snap.createTime?.toMillis() },
			{ merge: true }
		).catch(error => {
			console.error(error);
			return false;
		});
	});
