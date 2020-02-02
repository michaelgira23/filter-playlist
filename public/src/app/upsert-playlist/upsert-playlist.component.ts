import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { faBars, faTrashAlt } from '@fortawesome/pro-light-svg-icons';
import Fuse from 'fuse.js';
import 'spotify-api';

import { Action, ActionIfType, ActionIfCriteria, ActionThenAddToPlaylist, ActionThenType } from '../../model/actions';
import { FilteredPlaylist } from '../../model/filtered-playlist';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-upsert-playlist',
	templateUrl: './upsert-playlist.component.html',
	styleUrls: ['./upsert-playlist.component.scss']
})
export class UpsertPlaylistComponent implements OnInit {

	faBars = faBars;
	faTrashAlt = faTrashAlt;

	filteredPlaylist$: Observable<any>;

	playlists: SpotifyApi.PlaylistObjectSimplified[] = null;
	searchPlaylistOptions: Fuse.FuseOptions<SpotifyApi.PlaylistObjectSimplified> = {
		keys: ['name', 'description']
	};
	searchPlaylists: Fuse<SpotifyApi.PlaylistObjectSimplified, any>;

	form = this.fb.group({
		originId: [''],
		criteria: this.fb.array([]),
		actions: this.fb.array([])
	});

	get formCriteria() {
		return this.form.get('criteria') as FormArray;
	}

	get formActions() {
		return this.form.get('actions') as FormArray;
	}

	constructor(private route: ActivatedRoute, private router: Router, private fb: FormBuilder, private spotify: SpotifyService) { }

	ngOnInit() {
		this.addCriteria();
		this.addDefaultAction();

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

	onCriteriaChange() {
		this.ensureOneExtraCriteria();
	}

	ensureOneExtraCriteria() {
		const criteria = this.formCriteria.controls;
		const secondToLastCriterion = criteria[criteria.length - 2];
		const lastCriterion = criteria[criteria.length - 1];
		if (lastCriterion && lastCriterion.valid) {
			// Criteria all filled up; add another
			this.addCriteria();
		} else if (secondToLastCriterion && secondToLastCriterion.invalid) {
			// Both last and second to last are invalid; delete the last one
			criteria.splice(criteria.length - 1, 1);
			this.ensureOneExtraCriteria();
		}
	}

	reorderCriteria(event: CdkDragDrop<FormGroup>) {
		console.log('move item from', event.previousIndex, 'to', event.currentIndex);
		moveItemInArray(this.formCriteria.controls, event.previousIndex, event.currentIndex);
	}

	save() {
		console.log('Save playlist!', this.form.value);
	}

	addCriteria(purpose?: string, description?: string) {
		this.formCriteria.push(
			this.fb.group({
				purpose: [purpose || '', Validators.required],
				description: [description || '']
			})
		);
	}

	addDefaultAction() {
		this.addAction({
			if: {
				type: ActionIfType.ALL_PASSED
			},
			then: {
				type: ActionThenType.ADD_TO_PLAYLIST,
				id: null
			}
		});
	}

	deleteAction(index: number) {
		this.formActions.controls.splice(index, 1);
	}

	addAction(action: Action) {
		this.formActions.push(
			this.fb.group({
				ifType: action.if.type,
				ifId: (action.if as ActionIfCriteria).id || null,
				thenType: action.then.type,
				thenId: (action.then as ActionThenAddToPlaylist).id || null
			})
		);
	}

}
