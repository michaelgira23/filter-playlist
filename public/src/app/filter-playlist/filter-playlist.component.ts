import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { faChevronLeft } from '@fortawesome/pro-light-svg-icons';

import { environment } from '../../environments/environment';
import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { Criteria } from '../../model/criteria';
import { FirebaseFilteredPlaylist } from '../../model/filtered-playlist';

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

	spotifyPlayer: Spotify.SpotifyPlayer;

	constructor(private route: ActivatedRoute, private router: Router, private filteredPlaylists: FilteredPlaylistsService) { }

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

		// Initialize Spotify web player (for playing music in the browser)
		this.spotifyPlayer = new Spotify.Player({
			name: 'Filter Playlist App',
			getOAuthToken: cb => cb(environment.spotifyAccessToken)
		});

		this.spotifyPlayer.addListener('initialization_error', this.onSpotifyError);
		this.spotifyPlayer.addListener('authentication_error', this.onSpotifyError);
		this.spotifyPlayer.addListener('account_error', this.onSpotifyError);
		this.spotifyPlayer.addListener('playback_error', this.onSpotifyError);

		this.spotifyPlayer.addListener('player_state_changed', this.onSpotifyPlayerStateChanged);
		this.spotifyPlayer.addListener('ready', this.onSpotifyReady);
		this.spotifyPlayer.addListener('not_ready', this.onSpotifyNotReady);

		this.spotifyPlayer.connect();
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
	}

	onSpotifyReady(instance: Spotify.WebPlaybackInstance) {
		console.log('ready', instance);
	}

	onSpotifyNotReady(instance: Spotify.WebPlaybackInstance) {
		console.log('not ready', instance);
	}

}
