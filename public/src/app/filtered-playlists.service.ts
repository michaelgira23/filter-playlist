import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, DocumentChangeAction } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { switchMap, map, first, tap } from 'rxjs/operators';

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
	// 	return this.filteredPlaylistsCollection.valueChanges();
	// }

	upsert(playlist: UpsertFilteredPlaylist) {

		const firebasePlaylist: FirebaseFilteredPlaylist = {
			createdBy: this.afAuth.auth.currentUser.uid,
			originId: playlist.originId
		};

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
					console.log('already exists, update');
					return this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(playlist.id).update(firebasePlaylist);
				} else {
					console.log('add');
					return this.filteredPlaylistsCollection.add(firebasePlaylist);
				}
			}),
			tap(result => {
				console.log('result', result);
			})
		);
		this.filteredPlaylistsCollection.doc(playlist.id);

		if (playlist.id) {
			this.filteredPlaylistsCollection.doc<FirebaseFilteredPlaylist>(playlist.id).update(firebasePlaylist);
		} else {
			this.filteredPlaylistsCollection.add(firebasePlaylist);
		}

		// Update criteria
		for (const criterion of playlist.criteria) {
			// Check if criterion is invalid
			if (!criterion.purpose && !criterion.description) {
				// If did exist before, delete
				if (playlist.id) {

				}
				continue;
			}
		}
	}

	private deleteCriterion() {

	}
}
