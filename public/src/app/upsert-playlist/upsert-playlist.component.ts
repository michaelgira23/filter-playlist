import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray } from '@angular/forms';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import Fuse from 'fuse.js';
import 'spotify-api';

import { FilteredPlaylist } from '../../model/filtered-playlist';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-upsert-playlist',
	templateUrl: './upsert-playlist.component.html',
	styleUrls: ['./upsert-playlist.component.scss']
})
export class UpsertPlaylistComponent implements OnInit {

	filteredPlaylist$: Observable<any>;

	playlists: SpotifyApi.PlaylistObjectSimplified[] = null;
	searchPlaylistOptions: Fuse.FuseOptions<SpotifyApi.PlaylistObjectSimplified> = {
		keys: ['name', 'description']
	};
	searchPlaylists: Fuse<SpotifyApi.PlaylistObjectSimplified, any>;

	form = this.fb.group({
		originId: [''],
		criteria: this.fb.array([])
	});

	get formCriteria() {
		return this.form.get('criteria') as FormArray;
	}

	constructor(private route: ActivatedRoute, private router: Router, private fb: FormBuilder, private spotify: SpotifyService) { }

	ngOnInit() {
		this.addCriteria();

		this.filteredPlaylist$ = this.route.paramMap.pipe(
			// switchMap((params: ParamMap) => {

			// })
			map(params => params.get('id'))
		);

		this.spotify.getPlaylists().subscribe(
			playlists => {
				console.log('playlists', playlists);
				this.playlists = playlists.playlists;
				this.searchPlaylists = new Fuse(this.playlists, this.searchPlaylistOptions);
			}
		);
	}

	onSelectSource(source: SpotifyApi.PlaylistObjectSimplified) {
		console.log('select playlist', source);
	}

	save() {
		console.log('Save playlist!', this.form.value);
	}

	addCriteria() {
		this.formCriteria.push(
			this.fb.group({
				purpose: [''],
				description: ['']
			})
		);
	}

}
