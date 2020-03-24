import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, of, BehaviorSubject, from } from 'rxjs';
import { map, switchMap, first, filter, distinctUntilChanged } from 'rxjs/operators';
import { faChevronLeft, faPauseCircle, faPlayCircle, faStepBackward, faStepForward } from '@fortawesome/pro-light-svg-icons';
import SpotifyWebApi from 'spotify-web-api-node';

import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { Criteria } from '../../model/criteria';
import { FirebaseFilteredPlaylist } from '../../model/filtered-playlist';
import { FirebaseMarkedCriteria } from '../../model/filtered-song';
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
	// Interval for updating the playback progress bar
	updateProgressInterval: NodeJS.Timer;
	// ID of filtered playlist stored on our own database
	playlistId: string = null;
	// Filtered playlist object stored on our own database
	playlist: FirebaseFilteredPlaylist = null;
	// Playlist from Spotify
	spotifyPlaylist: SpotifyApi.SinglePlaylistResponse;
	// User-defined criteria to sort through the filtered playlist
	criteria: Criteria[] = [];
	// ID of all the criteria explicitly marked for the current song.
	// May include criteria already deleted (but we should internally keep just in case)
	criteriaForm: FirebaseMarkedCriteria = {};

	// Spotify API wrapper instance
	spotifyApi: SpotifyWebApi = null;
	// Spotify Player instance
	spotifyPlayer: Spotify.SpotifyPlayer = null;

	// RxJS subject whenever the Spotify playback changes songs
	song$ = new BehaviorSubject<string>(null);
	// Current song info
	songTitle: string = null;
	songArtists: string[] = null;
	songAlbum: string = null;
	songImageUrl: string = null;

	// Spotify player properties
	isPaused = true;
	// Timestamp since last updated
	playedSince: number = null;
	// Song position when player state was last updated
	songInitialPosition: number = null;
	// Current song position when accounting for current timestamp
	songCurrentPosition: number = null;
	// Duration of current song playing
	songDuration: number = null;
	// Progress percentage (0-1) of song
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
		// Get database information on the filtered playlist and criteria
		this.subscriptions.push(
			this.route.paramMap.pipe(
				map(params => params.get('id')),
				switchMap(playlistId => {
					return combineLatest(
						this.spotify.getAccessToken(),
						this.filteredPlaylists.getPlaylist(playlistId).snapshotChanges(),
						this.filteredPlaylists.getCriteria(playlistId).snapshotChanges()
					);
				}),
				switchMap(([{ accessToken }, playlistSnapshot, criteriaSnapshot]) => {
					this.playlistId = playlistSnapshot.payload.id;
					this.playlist = playlistSnapshot.payload.data();

					// Update criteria form to display the switches
					const newCriteria: Criteria[] = [];
					for (const snapshot of criteriaSnapshot) {
						newCriteria.push({
							id: snapshot.payload.doc.id,
							purpose: snapshot.payload.doc.data().purpose,
							description: snapshot.payload.doc.data().description
						});
					}
					this.criteria = newCriteria;

					// Setup Spotify playback + API
					return this.setupSpotify(accessToken, this.playlist.originId);
				}),
			).subscribe(
				() => {
					console.log('Successfully set up filter playlist');
				},
				error => {
					console.log('Error setting up song to filter', error);
					this.router.navigate(['/select']);
				}
			)
		);

		// Get the existing passed/failed criteria (i.e. the values to put in the form)
		this.subscriptions.push(
			this.song$.pipe(
				filter(uri => uri !== null),
				distinctUntilChanged(),
				switchMap(uri => this.filteredPlaylists.getFilteredSong(this.playlistId, uri).valueChanges())
			).subscribe(filteredSong => {
				// As backup: all new criteria defaults to false
				this.criteriaForm = {};
				for (const criterion of this.criteria) {
					this.criteriaForm[criterion.id] = false;
				}

				// Merge previous marked criteria, if it exists
				if (filteredSong && typeof filteredSong.markedCriteria === 'object') {
					Object.assign(this.criteriaForm, filteredSong.markedCriteria);
				}
			})
		);

		// Update the playback progress bar
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

	private setupSpotify(accessToken: string, originId: string) {

		// Connect to Spotify API (in addition to web player) so that we can actually control play/pause, etc.
		if (!this.spotifyApi) {
			this.spotifyApi = new SpotifyWebApi({ accessToken });
		}

		// Get playlist info + tracks from Spotify
		return from(this.spotifyApi.getPlaylist(originId)).pipe(
			map(result => {
				this.spotifyPlaylist = result.body;

				// Initialize Spotify web player (for playing music in the browser)
				if (!this.spotifyPlayer) {
					this.spotifyPlayer = new Spotify.Player({
						name: 'Filter Playlist App',
						getOAuthToken: cb => cb(accessToken)
					});
				}

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

	onSpotifyError(error: Error) {
		console.log('Spotify Error', error.message);
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

		this.song$.next(state.track_window.current_track.uri);
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

	filterSong() {
		console.log('submit form', this.criteriaForm);
		this.song$.pipe(
			first(),
			map(uri => {
				if (this.playlistId === null || uri === null) {
					throw new Error('No song is currently playing!');
				}
				return uri;
			}),
			// Save marked criteria in database
			switchMap(uri => this.filteredPlaylists.filterSong(this.playlistId, uri, this.criteriaForm)),
			// Skip to next track
			switchMap(() => from(this.nextTrack())),
		).subscribe(
			() => {
				console.log('Song successfully filtered!');
			},
			error => {
				console.log('Error!!', error);
			}
		);
	}

}
