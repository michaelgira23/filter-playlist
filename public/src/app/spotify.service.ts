import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, of, empty } from 'rxjs';
import { map, switchMap, expand, takeWhile, reduce } from 'rxjs/operators';
import SpotifyWebApi from 'spotify-web-api-node';
import 'spotify-api';

import { environment } from '../environments/environment';
import { SpotifyCredentials } from '../model/spotify-credentials';

@Injectable({
	providedIn: 'root'
})
export class SpotifyService {

	constructor(private afAuth: AngularFireAuth, private afs: AngularFirestore, private http: HttpClient) { }

	getPlaylists() {
		return this.generateOptions().pipe(
			switchMap(options =>
				this.http.get<GetPlaylistsResponse>(`${environment.firebaseFunctionsHost}/widgets/playlists`, options)
			)
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

	getAccessToken() {
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
