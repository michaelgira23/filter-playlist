import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faSortDown } from '@fortawesome/pro-solid-svg-icons';

@Component({
	selector: 'app-selection',
	templateUrl: './selection.component.html',
	styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

	faSortDown = faSortDown;

	@Input() selectionLabel: string;
	@Output() value = new EventEmitter<string>();

	selectedValue: string = null;
	// selectedValue = 'abcdefghijklmnopqrstuxyzabcdefghijklmnopqrstuvwxyz';

	constructor() { }

	ngOnInit() {
	}

}
