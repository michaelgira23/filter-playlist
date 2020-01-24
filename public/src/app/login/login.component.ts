import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	constructor(private route: ActivatedRoute, public afAuth: AngularFireAuth) { }

	ngOnInit() {
		this.route.queryParams.subscribe(params => {
			console.log('url params', params);
			if (params.error) {
				console.log('Spotify Error:', params.error);
			} else if (params.token) {
				console.log('javascript token!', params.token);
			}
		});
	}

	login() {
		console.log('Log in!');
		// this.afAuth.auth.signInWithCustomToken
		// this.afAuth.auth.signInWithPopup();
		window.location.href = 'https://us-central1-filter-playlist.cloudfunctions.net/login';
	}

}
