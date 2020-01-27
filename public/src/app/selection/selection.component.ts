import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { faTimes } from '@fortawesome/pro-light-svg-icons';
import { faSortDown } from '@fortawesome/pro-solid-svg-icons';

@Component({
	selector: 'app-selection',
	templateUrl: './selection.component.html',
	styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

	faSortDown = faSortDown;
	faTimes = faTimes;

	@Input() selectionLabel: string;
	@Input() searchResults: string[] = ['my last two brain cells', 'bepsi'];

	@Output() inputValue = new EventEmitter<string>();
	@Output() selectValue = new EventEmitter<string>();

	modal = false;

	selectedValue: string = null;
	// selectedValue = 'abcdefghijklmnopqrstuxyzabcdefghijklmnopqrstuvwxyz';

	constructor() { }

	ngOnInit() {
	}

	@HostListener('document:keydown', ['$event'])
	onKeyPress(event: KeyboardEvent) {
		if (this.modal && event.key === 'Escape') {
			this.hideModal();
		}
	}

	showModal() {
		this.modal = true;
	}

	hideModal() {
		this.modal = false;
	}

}
