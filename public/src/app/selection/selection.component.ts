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

	// Type of "thing" we're searching for (Ex. "Playlist" or "User")
	@Input() selectionLabel: string;
	// What property in the fuzzy search we should display in the results
	@Input() displayKey: string;
	// Value of the text input
	@Input() value = '';
	// What to display if no results found
	@Input() emptyMessage = 'Sorry! No results found.';
	// Fuse.js object for fuzzy search
	@Input()
	get search() {
		return this._search;
	}
	set search(fuse) {
		this._search = fuse;
		this.onSearch(this.value);
	}
	// tslint:disable-next-line: variable-name
	private _search: Fuse<any, Fuse.FuseOptions<any>>;

	// Search results to display
	searchResults: any[] = [];

	// Event when value selected
	@Output() selectValue = new EventEmitter<any>();
	// Value officially "selected" by the input
	selectedValue: string = null;

	modal = false;

	constructor() { }

	ngOnInit() {
	}

	@HostListener('document:keydown', ['$event'])
	onKeyPress(event: KeyboardEvent) {
		if (this.modal) {
			switch (event.key) {
				// Close modal on esc
				case 'Escape':
					this.hideModal();
					break;
				// Select first option on enter
				case 'Enter':
					console.log('enter');
					if (this.searchResults.length >= 1) {
						this.onSelect(this.searchResults[0]);
					} else {
						this.hideModal();
					}
					break;
			}
		}
	}

	onSearch(input: string) {
		console.log('search', input);
		if (this.search) {
			// const itemId = (this.search as any).options.id as string;
			// this.searchResults = (this.search.search(input) as string[]).map(resultId => {
			// 	const matchingItem = ((this.search as any).list as any[]).find(item => item[itemId] === resultId);
			// 	return matchingItem;
			// });

			this.searchResults = this.search.search(input);
		}
	}

	onSelect(result: any) {
		this.value = result[this.displayKey];
		this.selectedValue = result[this.displayKey];
		this.selectValue.emit(result);
		this.hideModal();
	}

	showModal() {
		this.modal = true;
	}

	hideModal() {
		this.modal = false;
	}

}
