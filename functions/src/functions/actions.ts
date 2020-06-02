import _ from 'lodash';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAction } from '../../../public/src/model/actions';
import { FirebaseFilteredPlaylist } from '../../../public/src/model/filtered-playlist';
import { FirebaseFilteredSong } from '../../../public/src/model/filtered-song';
import { spotifyFactory } from '../spotify';
import { executeThen } from '../lib/then-executer';
import { parseIf } from '../lib/if-parser';

/**
 * Trigger filtered playlist
 */
export const filteredPlaylistActions = functions.firestore
	.document('filteredPlaylists/{filteredPlaylistId}/filteredSongs/{songUri}')
	.onWrite(async (change, context) => {
		const beforeData = change.before.data() as FirebaseFilteredSong | undefined;
		const afterData = change.after.data() as FirebaseFilteredSong | undefined;

		// Skip if deleted
		if (!afterData) {
			return;
		}

		// Compare before and after snapshots to avoid infinite loop of updates
		const hasChanged = !change.before.exists || !_.isEqual(
			_.omit(beforeData, 'updatedAt'),
			_.omit(afterData, 'updatedAt')
		);
		if (!hasChanged) {
			console.log('marked criteria not changed. ignoring.');
			return;
		}

		const { filteredPlaylistId, songUri } = context.params;
		console.log('go through criteria', afterData);

		// Get playlist criteria and actions, and filtered playlist doc
		let filteredPlaylist: FirebaseFilteredPlaylist;
		const [criteriaSnapshot, actionsSnapshot, { Spotify: spotifyApi }] = await Promise.all([
			admin.firestore().collection('filterCriteria')
				.where('playlistId', '==', filteredPlaylistId)
				.orderBy('order').get(),
			admin.firestore().collection('filterActions')
				.where('playlistId', '==', filteredPlaylistId)
				.orderBy('order').get(),
			admin.firestore().collection('filteredPlaylists').doc(filteredPlaylistId).get().then(
				doc => {
					const filteredPlaylistData = doc.data() as FirebaseFilteredPlaylist | undefined;
					if (!filteredPlaylistData) {
						throw new Error('Filtered playlist does not exist!');
					}
					filteredPlaylist = filteredPlaylistData
					return spotifyFactory(filteredPlaylistData.createdBy);
				}
			)
		]);

		// const spotifyApi = await filtere

		// Only copy over the current criteria
		const markedCriteria: FirebaseFilteredSong['markedCriteria'] = {};
		criteriaSnapshot.forEach((doc) => {
			const id = doc.id;
			markedCriteria[id] = afterData.markedCriteria[id];
		});

		actionsSnapshot.forEach(async (doc) => {
			const action = doc.data() as FirebaseAction;
			console.log('action', action);

			// // Find out if action was (or would've been) executed before
			// let executedPreviously = false;
			// let shouldUndo = false;

			// console.log('before data', beforeData, afterData);
			// if (beforeData) {
			// 	executedPreviously = parseIf(beforeData.markedCriteria, action);
			// }

			// const shouldExecute = parseIf(afterData.markedCriteria)

			if (parseIf(markedCriteria, action)) {
				await executeThen(spotifyApi, filteredPlaylist.createdBy, songUri, action)
			}
		});

		/**
		 * Add `updatedAt` timestamp
		 */
		return change.after.ref.set(
			{ updatedAt: change.after.updateTime?.toMillis() },
			{ merge: true }
		).catch(error => {
			console.error(error);
			return false;
		});

	});
