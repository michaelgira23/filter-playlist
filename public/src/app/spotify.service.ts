import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { from } from 'rxjs';

import { environment } from '../environments/environment';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class SpotifyService {

	constructor(private afAuth: AngularFireAuth, private http: HttpClient) { }

	getPlaylists() {
		return this.generateOptions().pipe(
			switchMap(options => this.http.get(`${environment.firebaseFunctionsHost}/widgets/playlists`, options))
		);
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
