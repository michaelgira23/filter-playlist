import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireAuthModule } from '@angular/fire/auth';

import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { FilterPlaylistComponent } from './filter-playlist/filter-playlist.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';
import { UpsertPlaylistComponent } from './upsert-playlist/upsert-playlist.component';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		FilterPlaylistComponent,
		SelectPlaylistComponent,
		UpsertPlaylistComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAnalyticsModule,
		AngularFirestoreModule,
		AngularFireAuthModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
