import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule } from '@angular/fire/analytics';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireAuthGuardModule } from '@angular/fire/auth-guard';

import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { FilterPlaylistComponent } from './filter-playlist/filter-playlist.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';
import { UpsertPlaylistComponent } from './upsert-playlist/upsert-playlist.component';

@NgModule({
	declarations: [
		AppComponent,
		LoginComponent,
		LogoutComponent,
		FilterPlaylistComponent,
		SelectPlaylistComponent,
		UpsertPlaylistComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAnalyticsModule,
		AngularFirestoreModule,
		AngularFireAuthModule,
		AngularFireAuthGuardModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
