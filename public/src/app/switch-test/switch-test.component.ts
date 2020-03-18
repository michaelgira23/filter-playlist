import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-switch-test',
	templateUrl: './switch-test.component.html',
	styleUrls: ['./switch-test.component.scss']
})
export class SwitchTestComponent implements OnInit {

	value1: boolean = null;
	value2 = true;

	constructor() { }

	ngOnInit() {
	}

}
