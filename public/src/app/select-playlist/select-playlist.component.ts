import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { faEdit } from '@fortawesome/pro-light-svg-icons';

import { FilteredPlaylist } from '../../model/filtered-playlist';
import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-select-playlist',
	templateUrl: './select-playlist.component.html',
	styleUrls: ['./select-playlist.component.scss']
})
export class SelectPlaylistComponent implements OnInit, OnDestroy {

	faEdit = faEdit;

	subscriptions: Subscription[] = [];
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
		this.subscriptions.push(
			this.spotifyService.getAuthenticatedSpotify().pipe(
				switchMap(spotifyApi => this.spotifyService.getPlaylists(spotifyApi))
			).subscribe(playlists => {
				this.spotifyPlaylists = {};
				for (const playlist of playlists) {
					this.spotifyPlaylists[playlist.id] = playlist;
				}
			})
		);
	}

	ngOnDestroy() {
		for (const subscription of this.subscriptions) {
			if (subscription) {
				subscription.unsubscribe();
			}
		}
	}

	getPlaylistName(id: string) {
		return (this.spotifyPlaylists[id] && this.spotifyPlaylists[id].name) || '[PLAYLIST DELETED]';
	}

}
