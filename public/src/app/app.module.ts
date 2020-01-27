import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { AngularFirestoreModule } from '@angular/fire/firestore';
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
import { SelectionComponent } from './selection/selection.component';
import { ListItemComponent } from './list-item/list-item.component';

import { SpotifyService } from './spotify.service';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		LogoutComponent,
		FilterPlaylistComponent,
		SelectPlaylistComponent,
		UpsertPlaylistComponent,
		SelectionComponent,
		ListItemComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		FontAwesomeModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAnalyticsModule,
		AngularFirestoreModule,
		AngularFireAuthModule,
		AngularFireAuthGuardModule
	],
	providers: [
		SpotifyService
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
