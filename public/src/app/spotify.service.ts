import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, of, empty, BehaviorSubject } from 'rxjs';
import { map, switchMap, expand, takeWhile, reduce, tap, filter } from 'rxjs/operators';
import SpotifyWebApi from 'spotify-web-api-node';
import 'spotify-api';

import { environment } from '../environments/environment';
import { SpotifyCredentials } from '../model/spotify-credentials';

@Injectable({
	providedIn: 'root'
})
export class SpotifyService {

	// Timestamp that Spotify access token expires (in seconds)
	spotifyApiExpiresAt: number = null;
	spotifyApi$ = new BehaviorSubject<SpotifyWebApi>(null);

	constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) { }

	// getPlaylists() {
	// 	return this.generateOptions().pipe(
	// 		switchMap(options =>
	// 			this.http.get<GetPlaylistsResponse>(`${environment.firebaseFunctionsHost}/widgets/playlists`, options)
	// 		),
	// 		tap(b => console.log(b))
	// 	);
	// }

	getPlaylists(spotifyApi: SpotifyWebApi) {
		// Get first batch of playlists
		return from(spotifyApi.getUserPlaylists()).pipe(
			map(response => response.body),
			// Recursively add playlist requests until we get all the playlists
			expand((response: SpotifyApi.ListOfUsersPlaylistsResponse) => {
				// Check if remaining playlists
				const currentPlaylistCount = response.offset + response.limit;
				if (currentPlaylistCount < response.total) {
					return from(spotifyApi.getUserPlaylists(undefined, { offset: currentPlaylistCount })).pipe(
						map(playlistResponse => playlistResponse.body)
					);
				} else {
					// End of playlist list
					return of(null);
				}
			}, 1000),
			// Ensure we only take valid non-null values
			takeWhile(value => value !== null),
			map(trackResponse => trackResponse.items),
			// After all playlist retrievals completed, combine them all back together
			reduce((acc, value) => [...acc, ...value], [] as SpotifyApi.PlaylistObjectSimplified[])
		);
	}

	createPlaylist(name: string) {
		return this.generateOptions().pipe(
			switchMap(options =>
				this.http.post<GetPlaylistsResponse>(`${environment.firebaseFunctionsHost}/widgets/playlists`, { name }, options)
			)
		);
	}

	getSongsFromPlaylist(spotifyApi: SpotifyWebApi, playlistId: string) {
		// Initially get entire playlist object as well
		let playlistObject: SpotifyApi.SinglePlaylistResponse;
		return from(spotifyApi.getPlaylist(playlistId)).pipe(
			map(response => {
				playlistObject = response.body;
				return response.body.tracks;
			}),
			// Recursively add playlist track requests until we get all the playlist tracks
			expand((response: SpotifyApi.PlaylistTrackResponse) => {
				// Check if remaining playlists
				const currentSongCount = response.offset + response.limit;
				if (currentSongCount < response.total) {
					return from(spotifyApi.getPlaylistTracks(playlistId, { offset: currentSongCount })).pipe(
						map(trackResponse => trackResponse.body)
					);
				} else {
					// End of playlist
					return of(null);
				}
			}, 1000),
			// Ensure we only take valid non-null values
			takeWhile(value => value !== null),
			map(trackResponse => trackResponse.items),
			// After all playlist retrievals completed, combine them all back together
			reduce((acc, value) => [...acc, ...value], []),
			// Re-add the initial plyalist object
			map((tracks: SpotifyApi.PlaylistTrackObject[]) => ({ playlist: playlistObject, songs: tracks }))
		);
	}

	getAuthenticatedSpotify() {
		return this.getCredentials().pipe(
			map(({ accessToken }) => new SpotifyWebApi({ accessToken }))
		);
	}

	ensureAuthenticatedSpotify() {
		return this.spotifyApi$.pipe(
			switchMap(spotifyApi => {
				// Check if SpotifyApi not set or is expired
				if (spotifyApi === null) {
					return this.createSpotifyApi();
				} else if (this.spotifyApiExpiresAt && this.spotifyApiExpiresAt > Date.now() + 60) {
					return null;
				} else {
					return of(spotifyApi);
				}
			})
		);
	}

	private createSpotifyApi() {
		return this.getCredentials().pipe(
			map(credentials => {
				const newSpotifyApi = new SpotifyWebApi({
					accessToken: credentials.accessToken,
					refreshToken: credentials.refreshToken
				});
				this.spotifyApiExpiresAt = credentials.expiresAt * 1000;
				this.spotifyApi$.next(newSpotifyApi);
				return this.spotifyApi$;
			})
		);
	}

	private refreshSpotifyApi() {

		/** @TODO Ask backend to refresh Spotify tokens */
		// // Refresh access token if it expired (or will expire in 30 seconds)
		// if (currentTimestamp() >= credentials.expiresAt - 30) {
		// 	const refreshResult = await Spotify.refreshAccessToken();
		// 	const accessToken = refreshResult.body['access_token'];
		// 	const expiresAt = currentTimestamp() + refreshResult.body['expires_in'];
		// 	Spotify.setAccessToken(accessToken);
		// 	await credentialsDoc.update({ accessToken, expiresAt });
		// }

		// return Spotify;
	}

	getCredentials() {
		return this.afs.collection('spotifyCredentials').doc<SpotifyCredentials>(this.afAuth.auth.currentUser.uid).valueChanges();
	}

	private generateOptions() {
		return from(this.afAuth.auth.currentUser.getIdToken()).pipe(
			map(token => ({
				headers: new HttpHeaders({
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}),
			}))
		);
	}
}

interface GetPlaylistsResponse {
	playlists: SpotifyApi.PlaylistObjectSimplified[];
}
