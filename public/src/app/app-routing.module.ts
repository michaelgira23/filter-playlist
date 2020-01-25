import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AngularFireAuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';

import { LoginComponent } from './login/login.component';
import { FilterPlaylistComponent } from './filter-playlist/filter-playlist.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';
import { UpsertPlaylistComponent } from './upsert-playlist/upsert-playlist.component';

const authorizedOnly = () => redirectUnauthorizedTo(['login']);
const unauthorizedOnly = () => redirectLoggedInTo(['/']);

const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent,
		canActivate: [AngularFireAuthGuard],
		data: {
			authGuardPipe: unauthorizedOnly
		}
	},
	{
		path: 'create',
		component: UpsertPlaylistComponent,
		canActivate: [AngularFireAuthGuard],
		data: {
			authGuardPipe: authorizedOnly
		}
	},
	{
		path: 'playlists',
		component: SelectPlaylistComponent,
		canActivate: [AngularFireAuthGuard],
		data: {
			authGuardPipe: authorizedOnly
		}
	},
	{
		path: 'playlists/:id',
		children: [
			{
				path: 'edit',
				component: UpsertPlaylistComponent
			},
			{
				path: 'filter',
				component: FilterPlaylistComponent
			}
		],
		canActivate: [AngularFireAuthGuard],
		data: {
			authGuardPipe: authorizedOnly
		}
	},
	{
		path: '**',
		redirectTo: 'playlists'
	}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
