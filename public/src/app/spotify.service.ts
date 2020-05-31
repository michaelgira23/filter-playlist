import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, expand, takeWhile, reduce, tap, filter, first } from 'rxjs/operators';
import SpotifyWebApi from 'spotify-web-api-node';
import 'spotify-api';

import { environment } from '../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class SpotifyService {

	// Timestamp that Spotify access token expires (in seconds)
	private spotifyApiExpiresAt: number = null;
	private spotifyApi$ = new BehaviorSubject<SpotifyWebApi>(null);

	constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) { }

	getPlaylists() {
		let spotifyApi: SpotifyWebApi;
		return this.getAuthenticatedSpotify().pipe(
			// Get first batch of playlists
			switchMap(newSpotifyApi => {
				spotifyApi = newSpotifyApi;
				return from(spotifyApi.getUserPlaylists());
			}),
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
				this.http.post<GetPlaylistsResponse>(`${environment.firebaseFunctionsHost}/spotify/playlists`, { name }, options)
			)
		);
	}

	// getSongsFromPlaylist(playlistId: string) {
	// Initially get entire playlist object as well
	// let spotifyApi: SpotifyWebApi;
	// let playlistObject: SpotifyApi.SinglePlaylistResponse;
	// return this.getAuthenticatedSpotify().pipe(
	// 	switchMap(newSpotifyApi => {
	// 		spotifyApi = newSpotifyApi;
	// 		return from(spotifyApi.getPlaylist(playlistId));
	// 	}),
	// 	map(response => {
	// 		playlistObject = response.body;
	// 		return response.body.tracks;
	// 	}),
	// 	// Recursively add playlist track requests until we get all the playlist tracks
	// 	expand((response: SpotifyApi.PlaylistTrackResponse) => {
	// 		// Check if remaining playlists
	// 		const currentSongCount = response.offset + response.limit;
	// 		if (currentSongCount < response.total) {
	// 			return from(spotifyApi.getPlaylistTracks(playlistId, { offset: currentSongCount })).pipe(
	// 				map(trackResponse => trackResponse.body)
	// 			);
	// 		} else {
	// 			// End of playlist
	// 			return of(null);
	// 		}
	// 	}, 1000),
	// 	// Ensure we only take valid non-null values
	// 	takeWhile(value => value !== null),
	// 	map(trackResponse => trackResponse.items),
	// 	// After all playlist retrievals completed, combine them all back together
	// 	reduce((acc, value) => [...acc, ...value], []),
	// 	// Re-add the initial plyalist object
	// 	map((tracks: SpotifyApi.PlaylistTrackObject[]) => ({ playlist: playlistObject, songs: tracks }))
	// );
	// }

	/**
	 * Return a Spotify playlist object and songs according to the filtered playlist id
	 * @param playlistId Filtered playlist id
	 */
	getSongsFromPlaylist(playlistId: string) {
		return this.generateOptions().pipe(
			switchMap(options =>
				this.http.get<GetSongsFromPlaylistResponse>(`${environment.firebaseFunctionsHost}/spotify/songs/${playlistId}`, options)
			),
			tap(b => console.log(b))
		);
	}

	/**
	 * Return a SpotifyApi instance that will for-sure be authenticated
	 */
	getAuthenticatedSpotify() {
		// How much before the token actually expires which should trigger refresh
		const expireLeewayMs = 30 * 1000;

		return this.spotifyApi$.pipe(
			first(),
			switchMap(spotifyApi => {
				if (spotifyApi === null) {
					// SpotifyApi is not yet set
					return this.createSpotifyApi();
				} else if (this.spotifyApiExpiresAt && this.spotifyApiExpiresAt > Date.now() + expireLeewayMs) {
					// SpotifyApi is valid and not expiring soon
					return this.spotifyApi$;
				} else {
					// SpotifyApi is expiring soon
					return this.createSpotifyApi();
				}
			})
		);
	}

	/**
	 * Retrieve Spotify credentials from the backend to save them in the frontend of refresh if they're expiring
	 */
	private createSpotifyApi() {
		return this.generateOptions().pipe(
			switchMap(options =>
				this.http.get<GetTokenResponse>(`${environment.firebaseFunctionsHost}/auth/token`, options)
			),
			tap(b => console.log(b)),
			switchMap(({ accessToken, expiresAt }) => {
				this.spotifyApi$.next(new SpotifyWebApi({ accessToken }));
				this.spotifyApiExpiresAt = expiresAt * 1000;
				return this.spotifyApi$;
			})
		);
	}

	/**
	 * Generate HTTP header options for sending API requests to the Firebase functions backend
	 */
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

interface GetSongsFromPlaylistResponse {
	playlist: SpotifyApi.SinglePlaylistResponse;
	songs: SpotifyApi.PlaylistTrackObject[];
}

interface GetTokenResponse {
	accessToken: string;
	expiresAt: number;
}
