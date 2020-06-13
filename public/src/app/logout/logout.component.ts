import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-logout',
	templateUrl: './logout.component.html',
	styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

	constructor(private router: Router, private afAuth: AngularFireAuth, private spotifyService: SpotifyService) { }

	async ngOnInit() {
		await this.afAuth.auth.signOut();
		this.spotifyService.logout();
		this.router.navigate(['/']);
	}

}
