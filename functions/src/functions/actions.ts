import _ from 'lodash';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { FirebaseAction } from '../../../public/src/model/actions';
import { FirebaseFilteredPlaylist } from '../../../public/src/model/filtered-playlist';
import { FirebaseFilteredSong, FirebaseMarkedCriteria, FirebaseExecutedActions } from '../../../public/src/model/filtered-song';
import { spotifyFactory } from '../spotify';
import { executeThen, undoThen } from '../lib/then-executer';
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
		const ignoredKeys = ['updatedAt', 'executedActions'];
		const hasChanged = !change.before.exists || !_.isEqual(
			_.omit(beforeData, ignoredKeys),
			_.omit(afterData, ignoredKeys)
		);
		if (!hasChanged) {
			return;
		}

		const { filteredPlaylistId, songUri } = context.params;

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

		// Only copy over the current criteria
		const markedCriteria: FirebaseMarkedCriteria = {};
		criteriaSnapshot.forEach((doc) => {
			const id = doc.id;
			markedCriteria[id] = afterData.markedCriteria[id];
		});

		const executedActions: FirebaseExecutedActions = {};
		const previouslyExecutedActions: FirebaseExecutedActions = beforeData?.executedActions ?? {};
		actionsSnapshot.forEach(async (doc) => {
			const actionId = doc.id;
			const action = doc.data() as FirebaseAction;

			if (parseIf(markedCriteria, action)) {
				// Action meets criteria. Execute action only if hasn't been executed already
				executedActions[actionId] = true;
				if (!previouslyExecutedActions[actionId]) {
					await executeThen(spotifyApi, filteredPlaylist.originId, songUri, action);
				}
			} else {
				// Action does not meet criteria. Ensure action is not executed and undo if has been previously executed.
				executedActions[actionId] = false;
				if (previouslyExecutedActions[actionId]) {
					await undoThen(spotifyApi, filteredPlaylist.originId, songUri, action);
				}
			}
		});

		/**
		 * Add `updatedAt` timestamp
		 */
		return change.after.ref.set(
			{
				updatedAt: change.after.updateTime?.toMillis(),
				executedActions
			},
			{ merge: true }
		).catch(error => {
			console.error(error);
			return false;
		});

	});
