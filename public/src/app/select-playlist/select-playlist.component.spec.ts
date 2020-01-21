import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectPlaylistComponent } from './select-playlist.component';

describe('SelectPlaylistComponent', () => {
	let component: SelectPlaylistComponent;
	let fixture: ComponentFixture<SelectPlaylistComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SelectPlaylistComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SelectPlaylistComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
