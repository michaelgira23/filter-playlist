import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction, DocumentReference } from '@angular/fire/firestore';
import { combineLatest, from, of } from 'rxjs';
import { switchMap, map, first } from 'rxjs/operators';

import { FirebaseAction } from '../model/actions';
import { FirebaseCriteria } from '../model/criteria';
import { FilteredPlaylist, UpsertFilteredPlaylist, FirebaseFilteredPlaylist } from '../model/filtered-playlist';
import { ensureActionParameters } from './validators/actions.validator';

@Injectable({
	providedIn: 'root'
})
export class FilteredPlaylistsService {

	private filteredPlaylistsCollection: AngularFirestoreCollection<FirebaseFilteredPlaylist>;

	constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore) {
		this.filteredPlaylistsCollection = afs.collection<FilteredPlaylist>('filteredPlaylists');
	}

	getMyPlaylists() {
		return this.afs.collection<FilteredPlaylist>(
			'filteredPlaylists',
			ref => ref.where('createdBy', '==', this.afAuth.auth.currentUser.uid)
		);
	}

	// getPlaylist(id: string) {
	// 	return this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(id);
	// }

	getActions(playlistId: string) {
		return this.afs.collection<FirebaseAction>(
			'filterActions',
			ref => ref.where('playlistId', '==', playlistId)
		);
	}

	getCriteria(playlistId: string) {
		return this.afs.collection<FirebaseCriteria>(
			'filterCriteria',
			ref => ref.where('playlistId', '==', playlistId)
		);
	}

	upsert(playlist: UpsertFilteredPlaylist) {

		const firebasePlaylist: FirebaseFilteredPlaylist = {
			createdBy: this.afAuth.auth.currentUser.uid,
			originId: playlist.originId
		};

		let playlistDoc: DocumentReference;
		let actionsCollection: AngularFirestoreCollection<FirebaseAction>;
		let criteriaCollection: AngularFirestoreCollection<FirebaseCriteria>;
		return of(playlist.id).pipe(
			switchMap(id => {
				if (id) {
					return this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(id).get();
				} else {
					return of(null);
				}
			}),
			first(),
			// Determine whether playlist exists
			map((playlistRef: DocumentChangeAction<FirebaseFilteredPlaylist>) => {
				if (playlistRef === null) {
					return false;
				} else {
					return playlistRef.payload.doc.exists;
				}
			}),
			// Update or add playlist
			switchMap(exists => {
				console.log('update playlist or add');
				if (exists) {
					return from(
						this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(playlist.id).update(firebasePlaylist)
					).pipe(
						// Make sure we still return the document reference for the next step
						map(() => this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(playlist.id).ref)
					);
				} else {
					return this.filteredPlaylistsCollection.add(firebasePlaylist);
				}
			}),
			// Get existing critieria to see which to delete
			switchMap(playlistDocRef => {
				console.log('get existing criteria and actions for', playlistDocRef.id);
				playlistDoc = playlistDocRef;
				actionsCollection = this.getActions(playlistDocRef.id);
				criteriaCollection = this.getCriteria(playlistDocRef.id);
				return combineLatest(criteriaCollection.snapshotChanges(), actionsCollection.snapshotChanges());
			}),
			first(),
			switchMap(([dbActions, dbCriteria]) => {
				console.log('add new stuff');
				const existingActionIds = dbCriteria.map(criterion => criterion.payload.doc.id);
				const existingCriteriaIds = dbActions.map(action => action.payload.doc.id);
				const batch = this.afs.firestore.batch();

				let operations = 0;

				/**
				 * Insert criteria into the database
				 */

				let orderCriteriaAt = 0;
				for (const formCriterion of playlist.criteria) {

					// Get existing document reference or create a new one
					let exists: boolean;
					let criteriaId: string;
					if (existingCriteriaIds.includes(formCriterion.id)) {
						exists = true;
						criteriaId = formCriterion.id;
					} else {
						exists = false;
						criteriaId = this.afs.createId();
					}
					const docRef = criteriaCollection.doc(criteriaId).ref;

					// Check if form criteria is invalid
					if (!formCriterion.purpose && !formCriterion.description) {
						// If invalid criteria is already in database, delete in database too
						if (exists) {
							operations++;
							batch.delete(docRef);
						}
						continue;
					}

					// Update/create data at existing/new reference
					operations++;
					batch.set(docRef, {
						playlistId: playlistDoc.id,
						order: orderCriteriaAt++,
						purpose: formCriterion.purpose,
						description: formCriterion.description
					});
				}

				/**
				 * Insert actions into the database
				 */

				let orderActionsAt = 0;
				for (const formAction of playlist.actions) {

					// Get existing document reference or create a new one
					let exists: boolean;
					let criteriaId: string;
					if (existingActionIds.includes(formAction.id)) {
						exists = true;
						criteriaId = formAction.id;
					} else {
						exists = false;
						criteriaId = this.afs.createId();
					}
					const docRef = actionsCollection.doc(criteriaId).ref;

					// Check if form action is invalid
					if (!ensureActionParameters(formAction)) {
						// If invalid action is already in database, delete in database too
						if (exists) {
							operations++;
							batch.delete(docRef);
						}
						continue;
					}

					// Update/create data at existing/new reference
					operations++;
					batch.set(docRef, {
						playlistId: playlistDoc.id,
						order: orderActionsAt++,
						ifType: formAction.ifType,
						ifId: formAction.ifId,
						thenType: formAction.thenType,
						thenId: formAction.thenId
					});
				}

				console.log(`batch has ${operations} operations`);

				return from(batch.commit());
			})
		);
	}
}
