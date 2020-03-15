import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FilteredPlaylist } from '../../model/filtered-playlist';
import { FilteredPlaylistsService } from '../filtered-playlists.service';

@Component({
	selector: 'app-select-playlist',
	templateUrl: './select-playlist.component.html',
	styleUrls: ['./select-playlist.component.scss']
})
export class SelectPlaylistComponent implements OnInit {

	private filteredPlaylistsCollection: AngularFirestoreCollection<FilteredPlaylist>;
	filteredPlaylists: Observable<any[]>;

	constructor(private filteredPlaylistsService: FilteredPlaylistsService) {
	}

	ngOnInit() {
		this.filteredPlaylists = this.filteredPlaylistsService.getMyPlaylists().snapshotChanges().pipe(
			map(actions => actions.map(a => {
				const data = a.payload.doc.data() as FilteredPlaylist;
				const id = a.payload.doc.id;
				return { id, data };
			}))
		);
	}

}
