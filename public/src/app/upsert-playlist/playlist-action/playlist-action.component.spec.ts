import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistActionComponent } from './playlist-action.component';

describe('PlaylistActionComponent', () => {
	let component: PlaylistActionComponent;
	let fixture: ComponentFixture<PlaylistActionComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PlaylistActionComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaylistActionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
