import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormArray, Validators, FormGroup, ValidationErrors } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { faBars, faTrashAlt } from '@fortawesome/pro-light-svg-icons';
import Fuse from 'fuse.js';
import 'spotify-api';

import { Action, ActionIfType, ActionIfCriteria, ActionThenAddToPlaylist, ActionThenType, serializeAction } from '../../model/actions';
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
		originId: [null, Validators.required],
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

	/**
	 * When source playlist is created
	 * @param source Spotify object of the playlist selected
	 */
	onSelectSource(source: SpotifyApi.PlaylistObjectSimplified) {
		console.log('select playlist', source);
		this.form.setValue({ originId: source.id });
	}

	/**
	 * Add criteria input to the form
	 * @param purpose Initial value to put as the purpose
	 * @param description Initial value to put as the description
	 */
	addCriteria(purpose?: string, description?: string) {
		this.formCriteria.push(
			this.fb.group({
				purpose: [purpose || ''],
				description: [description || '']
			})
		);
	}

	/**
	 * Handle when inputs of criteria have changed (i.e. someone typed)
	 */
	onCriteriaChange() {
		this.ensureOneExtraCriteria();
	}

	/**
	 * Ensure that there is always another empty criteria at the end for a user to add more criteria.
	 * Having an empty purpose but filled description does not count as a valid criteria.
	 */
	ensureOneExtraCriteria() {
		const criteria = this.formCriteria.controls;
		const secondToLastCriterion = criteria[criteria.length - 2];
		const lastCriterion = criteria[criteria.length - 1];
		if (lastCriterion && lastCriterion.value.purpose.length) {
			// Criteria all filled up; add another
			this.addCriteria();
		} else if (secondToLastCriterion && secondToLastCriterion.invalid) {
			// Both last and second to last are invalid; delete the last one
			criteria.splice(criteria.length - 1, 1);
			this.ensureOneExtraCriteria();
		}
	}

	/**
	 * Reorder criteria
	 * @param event Angular CDK drag event object
	 */
	reorderCriteria(event: CdkDragDrop<FormGroup>) {
		moveItemInArray(this.formCriteria.controls, event.previousIndex, event.currentIndex);
		this.ensureOneExtraCriteria();
	}

	/**
	 * Add a blank action to the form
	 */
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

	/**
	 * Add a specific action to the form
	 * @param action Action object with proper values
	 */
	addAction(action: Action) {
		this.formActions.push(
			this.fb.group(serializeAction(action))
		);
	}

	/**
	 * Delete action from the form
	 * @param index Index of the action
	 */
	deleteAction(index: number) {
		// this.formActions.controls.splice(index, 1);
		this.formActions.removeAt(index);
	}

	/**
	 * Update/insert filtered playlist into backend
	 */
	save() {
		Object.keys(this.form.controls).forEach(key => {
			const controlErrors: ValidationErrors = this.form.get(key).errors;
			if (controlErrors != null) {
				Object.keys(controlErrors).forEach(keyError => {
					console.log('Key control: ' + key + ', keyError: ' + keyError + ', err value: ', controlErrors[keyError]);
				});
			}
		});

		console.log('Save playlist!', this.form.valid, this.form.value, this.form.errors);
	}

}
