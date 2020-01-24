import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { FilterPlaylistComponent } from './filter-playlist/filter-playlist.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';
import { UpsertPlaylistComponent } from './upsert-playlist/upsert-playlist.component';

const routes: Routes = [
	{
		path: 'login',
		component: LoginComponent
	},
	{
		path: 'select',
		component: SelectPlaylistComponent
	},
	{
		path: 'create',
		component: UpsertPlaylistComponent
	},
	{
		path: 'playlist/:id',
		children: [
			{
				path: 'edit',
				component: UpsertPlaylistComponent
			},
			{
				path: 'filter',
				component: FilterPlaylistComponent
			}
		]
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
