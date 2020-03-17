import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { faChevronLeft, faPauseCircle, faPlayCircle, faStepBackward, faStepForward } from '@fortawesome/pro-light-svg-icons';
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
	faPauseCircle = faPauseCircle;
	faPlayCircle = faPlayCircle;
	faStepBackward = faStepBackward;
	faStepForward = faStepForward;

	@ViewChild('progress', { static: false }) progress: ElementRef;

	subscriptions: Subscription[] = [];
	updateProgressInterval: NodeJS.Timer;
	playlist: FirebaseFilteredPlaylist = null;
	criteria: Criteria[] = [];

	spotifyApi: SpotifyWebApi;
	spotifyPlayer: Spotify.SpotifyPlayer;

	songTitle: string = null;
	songArtists: string[] = null;
	songAlbum: string = null;
	songImageUrl: string = null;

	isPaused = true;
	playedSince: number = null;
	songInitialPosition: number = null;
	songCurrentPosition: number = null;
	songDuration: number = null;
	get songProgress() {
		return this.songCurrentPosition / this.songDuration;
	}

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

		this.updateProgressInterval = setInterval(() => {
			this.updatePlaybackProgress();
		}, 100);

	}

	ngOnDestroy() {
		for (const subscription of this.subscriptions) {
			if (subscription) {
				subscription.unsubscribe();
			}
		}
		if (this.updateProgressInterval) {
			clearInterval(this.updateProgressInterval);
		}
	}

	onSpotifyError(error: Error) {
		console.log('error', error.message);
	}

	onSpotifyPlayerStateChanged(state: Spotify.PlaybackState) {
		console.log('state', state);
		if (state === null) {
			return;
		}

		this.songTitle = state.track_window.current_track.name;
		this.songArtists = [];
		for (const artist of state.track_window.current_track.artists) {
			this.songArtists.push(artist.name);
		}
		this.songAlbum = state.track_window.current_track.album.name;
		this.songImageUrl = state.track_window.current_track.album.images[0].url;

		this.isPaused = state.paused;
		this.playedSince = (state as any).timestamp;
		this.songInitialPosition = state.position;
		this.songCurrentPosition = state.position;
		this.songDuration = state.duration;
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

	updatePlaybackProgress() {
		if (!this.isPaused) {
			this.songCurrentPosition = (Date.now() - this.playedSince) + this.songInitialPosition;
		}
	}

	async togglePlayResume() {
		if (this.isPaused) {
			await this.spotifyApi.play();
		} else {
			await this.spotifyApi.pause();
		}
	}

	async previousTrack() {
		await this.spotifyApi.skipToPrevious();
	}

	async nextTrack() {
		await this.spotifyApi.skipToNext();
	}

	async skipTo(event: MouseEvent) {
		const bound = this.progress.nativeElement.getBoundingClientRect();
		const percentage = (event.clientX - bound.left) / bound.width;
		await this.spotifyApi.seek(Math.floor(percentage * this.songDuration));
	}

}
