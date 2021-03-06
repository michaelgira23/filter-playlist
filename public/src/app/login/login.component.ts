import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

	loading = null;

	constructor(private route: ActivatedRoute, private router: Router, public afAuth: AngularFireAuth, private http: HttpClient) { }

	ngOnInit() {
		this.route.queryParams.pipe(
			filter(params => {
				if (params.error) {
					console.log('Spotify Error:', params.error);
					this.loading = false;
					return false;
				} else if (params.code) {
					this.loading = true;
					return true;
				}
				this.loading = false;
				return false;
			}),
			switchMap(params => this.verifyToken(params.code, params.state))
		).subscribe(
			async token => {
				await this.afAuth.auth.signInWithCustomToken(token);
				this.router.navigate(['/']);
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
		window.location.href = `${environment.firebaseFunctionsHost}/auth/login`;
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
		return this.http.post<{ token: string }>(`${environment.firebaseFunctionsHost}/auth/token`, body, options).pipe(
			map(data => data.token)
		);
	}

}
