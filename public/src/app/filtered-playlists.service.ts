import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction, DocumentReference } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { switchMap, map, first, tap } from 'rxjs/operators';

import { Criteria } from '../model/criteria';
import { FilteredPlaylist, UpsertFilteredPlaylist, FirebaseFilteredPlaylist } from '../model/filtered-playlist';

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

	getCriteria(playlistId: string) {
		return this.afs.collection<Criteria>(`filteredPlaylists/${playlistId}/criteria`);
	}

	upsert(playlist: UpsertFilteredPlaylist) {

		const firebasePlaylist: FirebaseFilteredPlaylist = {
			createdBy: this.afAuth.auth.currentUser.uid,
			originId: playlist.originId
		};

		let criteriaCollection: AngularFirestoreCollection<Criteria>;
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
			switchMap(docRef => {
				// return docRef.collection('criteria').valueChanges();
				criteriaCollection = this.getCriteria(docRef.id);
				return criteriaCollection.snapshotChanges();
			}),
			first(),
			switchMap(criteria => {
				const existingCriteriaIds = criteria.map(criterion => criterion.payload.doc.id);
				const batch = this.afs.firestore.batch();

				let orderAt = 0;
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
							batch.delete(docRef);
						}
						continue;
					}

					// Update/create data at existing/new reference
					batch.set(docRef, {
						order: orderAt++,
						purpose: formCriterion.purpose,
						description: formCriterion.description
					});
				}

				return from(batch.commit());
			})
		);
	}
}
