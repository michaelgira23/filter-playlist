import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { faChevronLeft } from '@fortawesome/pro-light-svg-icons';

import { FilteredPlaylistsService } from '../filtered-playlists.service';
import { Criteria } from '../../model/criteria';
import { FirebaseFilteredPlaylist } from '../../model/filtered-playlist';

@Component({
	selector: 'app-filter-playlist',
	templateUrl: './filter-playlist.component.html',
	styleUrls: ['./filter-playlist.component.scss']
})
export class FilterPlaylistComponent implements OnInit, OnDestroy {

	faChevronLeft = faChevronLeft;

	subscriptions: Subscription[] = [];
	playlist: FirebaseFilteredPlaylist = null;
	criteria: Criteria[] = [];

	constructor(private route: ActivatedRoute, private router: Router, private filteredPlaylists: FilteredPlaylistsService) { }

	ngOnInit() {
		this.subscriptions.push(
			this.route.paramMap.pipe(
				map(params => params.get('id')),
				switchMap(playlistId => {
					return combineLatest(
						this.filteredPlaylists.getPlaylist(playlistId).snapshotChanges(),
						this.filteredPlaylists.getCriteria(playlistId).snapshotChanges()
					);
				})
			).subscribe(
				([playlistSnapshot, criteriaSnapshot]) => {
					console.log('playlist', playlistSnapshot, criteriaSnapshot);
					this.playlist = playlistSnapshot.payload.data();

					const newCriteria: Criteria[] = [];
					for (const snapshot of criteriaSnapshot) {
						newCriteria.push({
							id: snapshot.payload.doc.id,
							purpose: snapshot.payload.doc.data().purpose,
							description: snapshot.payload.doc.data().description
						});
					}
					this.criteria = newCriteria;
				},
				err => {
					this.router.navigate(['/select']);
				}
			)
		);
	}

	ngOnDestroy() {
		for (const subscription of this.subscriptions) {
			if (subscription) {
				subscription.unsubscribe();
			}
		}
	}

}
