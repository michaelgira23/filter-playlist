import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { faTimes } from '@fortawesome/pro-light-svg-icons';
import { faSortDown } from '@fortawesome/pro-solid-svg-icons';
import Fuse from 'fuse.js';

@Component({
	selector: 'app-selection',
	templateUrl: './selection.component.html',
	styleUrls: ['./selection.component.scss']
})
export class SelectionComponent implements OnInit {

	faSortDown = faSortDown;
	faTimes = faTimes;

	@Input() selectionLabel: string;
	@Input() search: Fuse<any, Fuse.FuseOptions<any>>;
	@Input() displayKey: string;

	@Input() value = '';

	searchResults: any[] = [];

	// @Input() searchResults: string[] = ['my last two brain cells', 'bepsi'];

	// @Output() inputValue = new EventEmitter<string>();
	// @Output() selectValue = new EventEmitter<string>();

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

	onSearch(input: string) {
		console.log('search', input);
		if (this.search) {
			const itemId = (this.search as any).options.id as string;
			this.searchResults = (this.search.search(input) as string[]).map(resultId => {
				const matchingItem = ((this.search as any).list as any[]).find(item => item[itemId] === resultId);
				return matchingItem[this.displayKey];
			});
			// console.log('search results', this.searchResults, this.search);
			// this.search.
		}
	}

	showModal() {
		this.modal = true;
	}

	hideModal() {
		this.modal = false;
	}

}
