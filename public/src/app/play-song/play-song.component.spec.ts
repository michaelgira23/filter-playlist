import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaySongComponent } from './play-song.component';

describe('PlaySongComponent', () => {
	let component: PlaySongComponent;
	let fixture: ComponentFixture<PlaySongComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [PlaySongComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaySongComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
