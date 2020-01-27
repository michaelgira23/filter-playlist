import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
	selector: 'app-selection',
	templateUrl: './selection.component.html',
	styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

	@Input() selectionLabel: string;
	@Output() value = new EventEmitter<string>();

	selectedValue: string = null;

	constructor() { }

	ngOnInit() {
	}

}
