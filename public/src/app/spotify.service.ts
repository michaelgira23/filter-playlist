import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

	// /**
	//  * Return a SpotifyWebApi instance that wraps around the Spotify web API
	//  * @param accessToken Optionally provide access token to reduce number of database queries
	//  */
	// getSpotifyApi(accessToken?: string) {

	// 	// Check if access token already provided
	// 	let token$;
	// 	if (accessToken) {
	// 		token$ = of(accessToken);
	// 	} else {
	// 		token$ = this.getAccessToken().pipe(
	// 			map(credentials => credentials.accessToken)
	// 		);
	// 	}

	// 	return token$.pipe(
	// 		map((token: string) => {
	// 			const Spotify = new SpotifyWebApi({ accessToken: token });
	// 		})
	// 	);
	// }

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
