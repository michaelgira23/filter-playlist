import _ from 'lodash';
import * as functions from 'firebase-functions';

/**
 * Add `createdAt` property on all documents
 */
export const documentCreatedDate = functions.firestore
	.document('{collectionId}/{documentId}')
	.onCreate((snap, context) => {
		return snap.ref.set(
			{ createdAt: snap.createTime?.toMillis() },
			{ merge: true }
		).catch(error => {
			console.error(error);
			return false;
		});
	});

/**
 * Add `updatedAt` property for filtered songs
 */
export const documentUpdatedDate = functions.firestore
	.document('filteredPlaylists/{playlistId}/filteredSongs/{documentId}')
	.onWrite((snap, context) => {

		// Compare before and after snapshots to avoid infinite loop of updates
		const hasChanged = !snap.before.exists || !_.isEqual(
			_.omit(snap.before.data(), 'updatedAt'),
			_.omit(snap.after.data(), 'updatedAt')
		);

		if (hasChanged) {
			return snap.after.ref.set(
				{ updatedAt: snap.after.updateTime?.toMillis() },
				{ merge: true }
			).catch(error => {
				console.error(error);
				return false;
			});
		} else {
			return false;
		}
	});
