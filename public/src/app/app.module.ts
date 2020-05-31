import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TextFieldModule } from '@angular/cdk/text-field';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { AngularFirestoreModule, SETTINGS } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { FilterPlaylistComponent } from './filter-playlist/filter-playlist.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';
import { UpsertPlaylistComponent } from './upsert-playlist/upsert-playlist.component';
import { PlaylistActionComponent } from './upsert-playlist/playlist-action/playlist-action.component';
import { SelectionComponent } from './selection/selection.component';
import { ListItemComponent } from './list-item/list-item.component';
import { SwitchComponent } from './switch/switch.component';
import { SwitchTestComponent } from './switch-test/switch-test.component';

import { FilteredPlaylistsService } from './filtered-playlists.service';
import { SpotifyService } from './spotify.service';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		LogoutComponent,
		FilterPlaylistComponent,
		SelectPlaylistComponent,
		UpsertPlaylistComponent,
		PlaylistActionComponent,
		SelectionComponent,
		ListItemComponent,
		SwitchComponent,
		SwitchTestComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		DragDropModule,
		TextFieldModule,
		FontAwesomeModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAnalyticsModule,
		AngularFirestoreModule,
		AngularFireAuthModule,
		AngularFireAuthGuardModule
	],
	providers: [
		{
			provide: SETTINGS,
			useValue: environment.production ? undefined : {
				host: 'localhost:8080',
				ssl: false
			}
		},
		FilteredPlaylistsService,
		SpotifyService
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
