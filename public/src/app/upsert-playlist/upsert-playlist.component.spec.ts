import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpsertPlaylistComponent } from './upsert-playlist.component';

describe('UpsertPlaylistComponent', () => {
	let component: UpsertPlaylistComponent;
	let fixture: ComponentFixture<UpsertPlaylistComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [UpsertPlaylistComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(UpsertPlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
