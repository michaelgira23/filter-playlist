import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { tap } from 'rxjs/operators';
import Fuse from 'fuse.js';
import 'spotify-api';

import { Action, ActionIfType, ActionThenType } from '../../../model/actions';
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
		ifType: ActionIfType.ALL_PASSED,
		ifId: null,
		thenType: ActionThenType.ADD_TO_PLAYLIST,
		thenId: null
	};
	@Input() searchPlaylists: Fuse<SpotifyApi.PlaylistObjectSimplified, any>;

	// Emit action object whenever the inputs change
	@Output() actionChange = new EventEmitter<Action>();

	thenPlaylist: SpotifyApi.PlaylistObjectSimplified = null;

	constructor(private cdr: ChangeDetectorRef, private spotifyService: SpotifyService) {
		this.attachChangeProxy();
	}

	ngOnInit() {
		this.cdr.detectChanges();
	}

	onThenPlaylistSelected(playlist: SpotifyApi.PlaylistObjectSimplified) {
		console.log('playlist selected then', playlist);
		if (playlist && this.action.thenType === ActionThenType.ADD_TO_PLAYLIST) {
			this.thenPlaylist = playlist;
			this.action.thenId = playlist.id;
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
	 * Add proxy to the action object so that component will emit whenever its properties change
	 */
	private attachChangeProxy() {
		this.action = new Proxy(this.action, {
			set: (obj, prop, value) => {
				obj[prop] = value;
				this.actionChange.emit(obj);
				return true;
			}
		});
	}

	/**
	 * Add functionality as a Reactive Forms input
	 */

	writeValue(obj: any): void {
		this.action = obj;
		this.attachChangeProxy();
	}
	registerOnChange(fn: any): void {
		this.actionChange.subscribe(changedAction => {
			console.log('register change', changedAction);
			fn(changedAction);
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
