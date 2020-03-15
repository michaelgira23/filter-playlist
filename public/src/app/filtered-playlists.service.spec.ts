import { TestBed } from '@angular/core/testing';

import { FilteredPlaylistsService } from './filtered-playlists.service';

describe('FilteredPlaylistsService', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should be created', () => {
		const service: FilteredPlaylistsService = TestBed.get(FilteredPlaylistsService);
		expect(service).toBeTruthy();
	});
});
