import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { filter, switchMap, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	constructor(private route: ActivatedRoute, public afAuth: AngularFireAuth, private http: HttpClient) { }

	ngOnInit() {
		this.route.queryParams.pipe(
			filter(params => {
				console.log('url params', params, !!params.error, params.code);
				if (params.error) {
					console.log('Spotify Error:', params.error);
					return false;
				} else if (params.code) {
					console.log('javascript token!', params.code);
					return true;
				}
				return false;
			}),
			switchMap(params => this.verifyToken(params.code, params.state))
		).subscribe(
			async token => {
				console.log('token', token);
				await this.afAuth.auth.signInWithCustomToken(token);
			},
			error => {
				if (error.error instanceof ErrorEvent) {
					console.log('Error occurred', error.error.message);
				} else {
					console.log('Backend error', error.status, error.error);
				}
			}
		);
	}

	login() {
		console.log('Log in!');
		window.location.href = `${environment.firebaseFunctionsHost}/widgets/login`;
	}

	/**
	 * Verify Spotify OAuth token in the backend
	 * @param token Spotify OAuth token
	 */
	verifyToken(token: string, state: string) {
		const body = { token, state };
		const options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json'
			}),
			// Send cookies with request
			withCredentials: true
		};
		return this.http.post<{ token: string }>(`${environment.firebaseFunctionsHost}/widgets/token`, body, options).pipe(
			map(data => data.token)
		);
	}

}
