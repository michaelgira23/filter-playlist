import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { PlaySongComponent } from './play-song/play-song.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';

const routes: Routes = [
	{
		path: 'select',
		component: SelectPlaylistComponent
	},
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: '**',
		redirectTo: 'select'
	}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
