import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FilteredPlaylist } from '../../model/filtered-playlist';

@Component({
	selector: 'app-select-playlist',
	templateUrl: './select-playlist.component.html',
	styleUrls: ['./select-playlist.component.scss']
})
export class SelectPlaylistComponent implements OnInit {

	private filteredPlaylistsCollection: AngularFirestoreCollection<FilteredPlaylist>;
	filteredPlaylists: Observable<any[]>;

	constructor(db: AngularFirestore) {
		// this.filteredPlaylists = db.collection('filteredPlaylists').snapshotChanges();
		this.filteredPlaylistsCollection = db.collection('filteredPlaylists');
		// this.filteredPlaylists = this.filteredPlaylistsCollection.valueChanges();
		this.filteredPlaylists = this.filteredPlaylistsCollection.snapshotChanges().pipe(
			map(actions => actions.map(a => {
				const data = a.payload.doc.data() as FilteredPlaylist;
				const id = a.payload.doc.id;
				return { id, data };
			}))
		);
	}

	ngOnInit() {
	}

}
