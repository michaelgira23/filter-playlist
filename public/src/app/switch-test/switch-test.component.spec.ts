import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchTestComponent } from './switch-test.component';

describe('SwitchTestComponent', () => {
	let component: SwitchTestComponent;
	let fixture: ComponentFixture<SwitchTestComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SwitchTestComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SwitchTestComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
