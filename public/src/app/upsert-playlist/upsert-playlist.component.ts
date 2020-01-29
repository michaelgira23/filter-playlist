import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import 'spotify-api';

import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-upsert-playlist',
	templateUrl: './upsert-playlist.component.html',
	styleUrls: ['./upsert-playlist.component.scss']
})
export class UpsertPlaylistComponent implements OnInit {

	filteredPlaylist$: Observable<any>;
	playlists: SpotifyApi.PlaylistObjectSimplified[] = null;

	constructor(private route: ActivatedRoute, private router: Router, private spotify: SpotifyService) { }

	ngOnInit() {
		this.filteredPlaylist$ = this.route.paramMap.pipe(
			// switchMap((params: ParamMap) => {

			// })
			map(params => params.get('id'))
		);

		this.spotify.getPlaylists().subscribe(
			playlists => {
				console.log('playlists', playlists);
				this.playlists = playlists.playlists;
			}
		);
	}

}
