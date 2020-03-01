import { Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { tap } from 'rxjs/operators';
import Fuse from 'fuse.js';
import 'spotify-api';

import { Action, ActionIfType, ActionThenType, ActionThenAddToPlaylist, serializeAction, deserializeAction } from '../../../model/actions';
import { SpotifyService } from '../../spotify.service';

@Component({
	selector: 'app-playlist-action',
	templateUrl: './playlist-action.component.html',
	styleUrls: ['./playlist-action.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => PlaylistActionComponent),
			multi: true
		}
	]
})
export class PlaylistActionComponent implements ControlValueAccessor, OnInit {

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

	// Emit action object whenever the inputs change
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

	/**
	 * Logic to create a Spotify playlist on the Spotify platform
	 * @param name Name of the playlist
	 */
	createPlaylist(name: string) {
		return this.spotifyService.createPlaylist(name).pipe(
			// Add new playlist to the list of existing onces for search
			tap(playlist => {
				(this.searchPlaylists as any).list.push(playlist);
				console.log('playlist', playlist);
			})
		);
	}

	/**
	 * Add functionality as a Reactive Forms input
	 */

	writeValue(obj: any): void {
		console.log('write value', deserializeAction(obj));
		this.action = deserializeAction(obj);
	}
	registerOnChange(fn: any): void {
		this.actionChange.subscribe(changedAction => {
			fn(serializeAction(changedAction));
		});
	}
	registerOnTouched(fn: any): void {
		/** @TODO */
		// throw new Error('Method not implemented.');
	}
	setDisabledState?(isDisabled: boolean): void {
		/** @TODO */
		// throw new Error('Method not implemented.');
	}

}
