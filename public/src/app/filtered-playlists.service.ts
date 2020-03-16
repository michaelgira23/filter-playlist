import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction, DocumentReference, DocumentSnapshot } from '@angular/fire/firestore';
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

	getPlaylist(playlistId: string) {
		return this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(playlistId);
	}

	getActions(playlistId: string) {
		return this.afs.collection<FirebaseAction>(
			'filterActions',
			ref => ref.where('playlistId', '==', playlistId).orderBy('order')
		);
	}

	getCriteria(playlistId: string) {
		return this.afs.collection<FirebaseCriteria>(
			'filterCriteria',
			ref => ref.where('playlistId', '==', playlistId).orderBy('order')
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
			map((playlistRef: DocumentChangeAction<FirebaseFilteredPlaylist> | DocumentSnapshot<FirebaseFilteredPlaylist>) => {
				console.log('get filtered p', playlistRef);
				if (playlistRef === null) {
					return false;
				} else if (typeof (playlistRef as DocumentSnapshot<FirebaseFilteredPlaylist>).exists === 'boolean') {
					return (playlistRef as DocumentSnapshot<FirebaseFilteredPlaylist>).exists;
				} else {
					return (playlistRef as DocumentChangeAction<FirebaseFilteredPlaylist>).payload.doc.exists;
				}
			}),
			// Update or add playlist
			switchMap(exists => {
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
				playlistDoc = playlistDocRef;
				actionsCollection = this.getActions(playlistDocRef.id);
				criteriaCollection = this.getCriteria(playlistDocRef.id);
				return combineLatest(actionsCollection.snapshotChanges(), criteriaCollection.snapshotChanges());
			}),
			first(),
			switchMap(([dbActions, dbCriteria]) => {
				const existingActionIds = dbActions.map(action => action.payload.doc.id);
				const existingCriteriaIds = dbCriteria.map(criterion => criterion.payload.doc.id);
				const batch = this.afs.firestore.batch();

				console.log('existing crit ids', existingCriteriaIds);

				/**
				 * Insert criteria into the database
				 */

				let orderCriteriaAt = 0;
				for (const formCriterion of playlist.criteria) {
					console.log('id exists?', formCriterion.id);
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
					console.log('exists?', exists, 'id', criteriaId);
					const docRef = criteriaCollection.doc(criteriaId).ref;

					// Check if form criteria is invalid
					if (!formCriterion.purpose && !formCriterion.description) {
						// If invalid criteria is already in database, delete in database too
						if (exists) {
							batch.delete(docRef);
						}
						continue;
					}

					// Update/create data at existing/new reference
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
							batch.delete(docRef);
						}
						continue;
					}

					// Update/create data at existing/new reference
					batch.set(docRef, {
						playlistId: playlistDoc.id,
						order: orderActionsAt++,
						ifType: formAction.ifType,
						ifId: formAction.ifId,
						thenType: formAction.thenType,
						thenId: formAction.thenId
					});
				}

				return from(batch.commit());
			})
		);
	}
}
