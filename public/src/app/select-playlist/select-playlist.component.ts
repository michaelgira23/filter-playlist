import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FilteredPlaylist } from '../../model/filtered-playlist';
import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-select-playlist',
	templateUrl: './select-playlist.component.html',
	styleUrls: ['./select-playlist.component.scss']
})
export class SelectPlaylistComponent implements OnInit {

	filteredPlaylists$: Observable<any[]>;
	spotifyPlaylists: { [id: string]: SpotifyApi.PlaylistObjectSimplified } = {};

	constructor(private filteredPlaylistsService: FilteredPlaylistsService, private spotifyService: SpotifyService) {
	}

	ngOnInit() {
		this.filteredPlaylists$ = this.filteredPlaylistsService.getMyPlaylists().snapshotChanges().pipe(
			map(actions => actions.map(a => {
				const data = a.payload.doc.data() as FilteredPlaylist;
				const id = a.payload.doc.id;
				return { id, data };
			}))
		);

		// Index Spotify playlists by their id
		this.spotifyService.getPlaylists().subscribe(response => {
			this.spotifyPlaylists = {};
			for (const playlist of response.playlists) {
				this.spotifyPlaylists[playlist.id] = playlist;
			}
		});
	}

	getPlaylistName(id: string) {
		return (this.spotifyPlaylists[id] && this.spotifyPlaylists[id].name) || '[PLAYLIST DELETED]';
	}

}
