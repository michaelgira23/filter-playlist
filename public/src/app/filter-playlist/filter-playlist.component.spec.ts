import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPlaylistComponent } from './filter-playlist.component';

describe('FilterPlaylistComponent', () => {
	let component: FilterPlaylistComponent;
	let fixture: ComponentFixture<FilterPlaylistComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FilterPlaylistComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FilterPlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
