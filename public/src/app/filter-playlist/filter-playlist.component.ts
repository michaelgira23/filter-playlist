import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { faChevronLeft } from '@fortawesome/pro-light-svg-icons';
import SpotifyWebApi from 'spotify-web-api-node';

import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { Criteria } from '../../model/criteria';
import { FirebaseFilteredPlaylist } from '../../model/filtered-playlist';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-filter-playlist',
	templateUrl: './filter-playlist.component.html',
	styleUrls: ['./filter-playlist.component.scss']
})
export class FilterPlaylistComponent implements OnInit, OnDestroy {

	faChevronLeft = faChevronLeft;

	subscriptions: Subscription[] = [];
	playlist: FirebaseFilteredPlaylist = null;
	criteria: Criteria[] = [];

	spotifyApi: SpotifyWebApi;
	spotifyPlayer: Spotify.SpotifyPlayer;

	songTitle: string = null;
	songArtists: string[] = null;
	songAlbum: string = null;
	songImageUrl: string = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private filteredPlaylists: FilteredPlaylistsService,
		private spotify: SpotifyService
	) { }

	ngOnInit() {
		this.subscriptions.push(
			this.route.paramMap.pipe(
				map(params => params.get('id')),
				switchMap(playlistId => {
					return combineLatest(
						this.filteredPlaylists.getPlaylist(playlistId).snapshotChanges(),
						this.filteredPlaylists.getCriteria(playlistId).snapshotChanges()
					);
				})
			).subscribe(
				([playlistSnapshot, criteriaSnapshot]) => {
					console.log('playlist', playlistSnapshot, criteriaSnapshot);
					this.playlist = playlistSnapshot.payload.data();

					const newCriteria: Criteria[] = [];
					for (const snapshot of criteriaSnapshot) {
						newCriteria.push({
							id: snapshot.payload.doc.id,
							purpose: snapshot.payload.doc.data().purpose,
							description: snapshot.payload.doc.data().description
						});
					}
					this.criteria = newCriteria;
				},
				err => {
					this.router.navigate(['/select']);
				}
			)
		);

		this.subscriptions.push(
			this.spotify.getAccessToken().pipe().subscribe(({ accessToken }) => {
				// Connect to Spotify API (in addition to web player) so that we can actually control play/pause, etc.
				this.spotifyApi = new SpotifyWebApi({ accessToken });

				// Initialize Spotify web player (for playing music in the browser)
				this.spotifyPlayer = new Spotify.Player({
					name: 'Filter Playlist App',
					getOAuthToken: cb => cb(accessToken)
				});

				this.spotifyPlayer.addListener('initialization_error', this.onSpotifyError.bind(this));
				this.spotifyPlayer.addListener('authentication_error', this.onSpotifyError.bind(this));
				this.spotifyPlayer.addListener('account_error', this.onSpotifyError.bind(this));
				this.spotifyPlayer.addListener('playback_error', this.onSpotifyError.bind(this));

				this.spotifyPlayer.addListener('player_state_changed', this.onSpotifyPlayerStateChanged.bind(this));
				this.spotifyPlayer.addListener('ready', this.onSpotifyReady.bind(this));
				this.spotifyPlayer.addListener('not_ready', this.onSpotifyNotReady.bind(this));

				this.spotifyPlayer.connect();
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

	onSpotifyError(error: Error) {
		console.log('error', error.message);
	}

	onSpotifyPlayerStateChanged(state: Spotify.PlaybackState) {
		console.log('state', state);
		this.songTitle = state.track_window.current_track.name;
		this.songArtists = [];
		for (const artist of state.track_window.current_track.artists) {
			this.songArtists.push(artist.name);
		}
		this.songAlbum = state.track_window.current_track.album.name;
		this.songImageUrl = state.track_window.current_track.album.images[0].url;
	}

	async onSpotifyReady(instance: Spotify.WebPlaybackInstance) {
		console.log('ready', instance, [instance.device_id]);
		await this.spotifyApi.transferMyPlayback({
			// Typings say `device_ids`, but actually `deviceIds`
			deviceIds: [instance.device_id],
			play: true
		} as any);
	}

	onSpotifyNotReady(instance: Spotify.WebPlaybackInstance) {
		console.log('not ready', instance);
	}

}
