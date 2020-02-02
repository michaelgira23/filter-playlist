import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { tap } from 'rxjs/operators';
import Fuse from 'fuse.js';
import 'spotify-api';

import { Action, ActionIfType, ActionThenType, ActionThenAddToPlaylist } from '../../../model/actions';
import { SpotifyService } from '../../spotify.service';

@Component({
	selector: 'app-playlist-action',
	templateUrl: './playlist-action.component.html',
	styleUrls: ['./playlist-action.component.scss']
})
export class PlaylistActionComponent implements OnInit {

	ActionIfType = ActionIfType;
	ActionThenType = ActionThenType;

	@Input() action: Action = {
		if: {
			type: ActionIfType.ALL_PASSED
		},
		then: {
			type: ActionThenType.ADD_TO_PLAYLIST,
			id: null
		}
	};
	@Input() searchPlaylists: Fuse<SpotifyApi.PlaylistObjectSimplified, any>;

	@Output() actionChange = new EventEmitter<Action>();

	thenPlaylist: SpotifyApi.PlaylistObjectSimplified = null;

	constructor(private spotifyService: SpotifyService) { }

	ngOnInit() {
	}

	onThenPlaylistSelected(playlist: SpotifyApi.PlaylistObjectSimplified) {
		console.log('playlist selected then', playlist);
		if (playlist && this.action.then.type === ActionThenType.ADD_TO_PLAYLIST) {
			this.thenPlaylist = playlist;
			(this.action.then as ActionThenAddToPlaylist).id = playlist.id;
		}
	}

	createPlaylist(name: string) {
		return this.spotifyService.createPlaylist(name).pipe(
			// Add new playlist to the list of existing onces for search
			tap(playlist => {
				(this.searchPlaylists as any).list.push(playlist);
				console.log('playlist', playlist);
			})
		);
	}

}
