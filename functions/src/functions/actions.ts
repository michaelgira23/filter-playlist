import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { MarkedCriteria } from '../lib/if-parser';

/**
 * Trigger filtered playlist
 */
export const filteredPlaylistActions = functions.firestore
	.document('filteredPlaylists/{filteredPlaylistId}/filteredSongs/{documentId}')
	.onWrite(async (change, context) => {
		const documentData = change.after.data();
		if (!documentData) {
			return;
		}

		const { filteredPlaylistId, documentId } = context.params;
		console.log('go through criteria', change.after.data());

		// Get playlist criteria and actions
		const criteriaSnapshot = await admin.firestore().collection('filterCriteria')
			.where('playlistId', '==', filteredPlaylistId)
			.orderBy('order').get();
		const actionsSnapshot = await admin.firestore().collection('filterActions')
			.where('playlistId', '==', filteredPlaylistId)
			.orderBy('order').get();

		// Only copy over the current criteria
		const markedCriteria: MarkedCriteria = {};
		criteriaSnapshot.forEach((doc) => {
			markedCriteria[doc.id] = documentData.markedCriteria[doc.id];
		});

		actionsSnapshot.forEach((doc) => {

		});

	});
