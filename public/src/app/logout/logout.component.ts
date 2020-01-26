import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
	selector: 'app-logout',
	templateUrl: './logout.component.html',
	styleUrls: ['./logout.component.scss']
})
export class LogoutComponent implements OnInit {

	constructor(private router: Router, private afAuth: AngularFireAuth) { }

	async ngOnInit() {
		await this.afAuth.auth.signOut();
		this.router.navigate(['/']);
	}

}
