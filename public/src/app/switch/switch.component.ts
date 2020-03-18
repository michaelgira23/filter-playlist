import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
	selector: 'app-switch',
	templateUrl: './switch.component.html',
	styleUrls: ['./switch.component.scss']
})
export class SwitchComponent implements OnInit {

	static counter = 0;

	// Label for both the `id` and `for` attribute of the checkbox input and label, respectively.
	// Must be unique for every switch on the page or else only the first one will work!
	@Input() label = `checky-${SwitchComponent.counter++}`;

	@Input() value: boolean = null;
	@Output() valueChange = new EventEmitter<boolean>();

	constructor() { }

	ngOnInit() {
	}

}
