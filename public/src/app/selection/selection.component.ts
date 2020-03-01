import { Component, EventEmitter, HostListener, Input, OnInit, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { faTimes } from '@fortawesome/pro-light-svg-icons';
import { faSortDown } from '@fortawesome/pro-solid-svg-icons';
import Fuse from 'fuse.js';

@Component({
	selector: 'app-selection',
	templateUrl: './selection.component.html',
	styleUrls: ['./selection.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SelectionComponent),
			multi: true
		}
	]
})
export class SelectionComponent implements ControlValueAccessor, OnInit {
	// Fuse.js object for fuzzy search
	@Input()
	get search() {
		return this._search;
	}
	set search(fuse) {
		this._search = fuse;
		this.refreshSearch();
	}

	constructor() { }

	faSortDown = faSortDown;
	faTimes = faTimes;

	// Type of "thing" we're searching for (Ex. "Playlist" or "User")
	@Input() selectionLabel: string;
	// What property in the fuzzy search we should display in the results
	@Input() displayKey: string;
	// What property in the fuzzy search we should use as the input value
	@Input() valueKey: string;
	// Whether to allow option to create a new thing too
	@Input() create = false;
	// Value of the text input
	@Input() value = '';
	// What to display if no results found
	@Input() emptyMessage = 'Sorry! No results found.';
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
	// Callback for creating something.
	/** @TODO If there's a more "Angular" way to do this without too many limitations */
	@Input() onCreate: (value: string) => Observable<any> = () => of(null);

	ngOnInit() {
		// If parent inputted value, display that
		if (this.value) {
			this.selectedValue = this.value;
		}
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
		if (result) {
			this.value = result[this.displayKey];
			this.selectedValue = result[this.displayKey];
		} else {
			this.value = '';
			this.selectedValue = result;
		}
		this.selectValue.emit(result);
		this.hideModal();
		this.refreshSearch();
	}

	onCreateButton() {
		console.log('create with result', this.value);
		this.onCreate(this.value).subscribe(
			result => {
				console.log('created thing', result);
				this.onSelect(result);
			},
			err => {
				console.log('Error creating thing!', err);
			}
		);
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

	/**
	 * Add functionality as a reactive forms input
	 */

	writeValue(obj: any): void {
		if (typeof obj === 'string') {
			this.onSelect({ [this.displayKey]: obj });
		} else {
			this.onSelect(obj);
		}
	}

	registerOnChange(fn: any): void {
		this.selectValue.subscribe(selectedValue => {
			fn(selectedValue[this.valueKey]);
		});
	}

	registerOnTouched(fn: any): void {
		/** @TODO */
		// throw new Error('Method not implemented.');
	}

	setDisabledState?(isDisabled: boolean): void {
		/** @TODO */
		// throw new Error('Method not implemented.');
	}

}
