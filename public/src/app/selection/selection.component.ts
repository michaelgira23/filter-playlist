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
		this.refreshSearch();
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
	private focusResult: any = null;

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
					if (this.focusResult) {
						this.onSelect(this.focusResult);
					} else if (this.searchResults.length >= 1) {
						this.onSelect(this.searchResults[0]);
					} else {
						this.hideModal();
					}
					break;
			}
		}
	}

	refreshSearch() {
		this.onSearch(this.value);
	}

	onSearch(input: string) {
		if (this.search) {
			this.searchResults = this.search.search(input);
		}
	}

	onSelect(result: any) {
		this.value = result[this.displayKey];
		this.selectedValue = result[this.displayKey];
		this.selectValue.emit(result);
		this.hideModal();
		this.refreshSearch();
	}

	onFocus(result: any) {
		this.focusResult = result;
	}

	onUnfocus() {
		this.focusResult = null;
	}

	showModal() {
		this.modal = true;
	}

	hideModal() {
		this.modal = false;
	}

}
