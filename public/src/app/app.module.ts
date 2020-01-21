import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PlaySongComponent } from './play-song/play-song.component';
import { LoginComponent } from './login/login.component';
import { SelectPlaylistComponent } from './select-playlist/select-playlist.component';

@NgModule({
	declarations: [
		AppComponent,
		PlaySongComponent,
		LoginComponent,
		SelectPlaylistComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
