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
		console.log('search reassigned', fuse);
		this.mapInternalValueToDisplayValue();
	}
	// tslint:disable-next-line: variable-name
	private _search: Fuse<any, Fuse.FuseOptions<any>>;

	@Input()
	get value() {
		return this.selectedInternalValue;
	}
	set value(newValue: string) {
		this.selectedInternalValue = newValue;
		console.log('value updated', newValue);
		this.mapInternalValueToDisplayValue();
	}

	constructor() { }

	faSortDown = faSortDown;
	faTimes = faTimes;

	// Type of "thing" we're searching for (Ex. "Playlist" or "User")
	@Input() selectionLabel: string;
	// What property in the fuzzy search we should display in the results
	@Input() displayKey: string;
	// What property in the fuzzy search we should use as the output value
	@Input() valueKey: string;
	// Whether to allow option to create a new thing too
	@Input() create = false;
	// Value of the text input
	@Input() searchValue = '';
	// What to display if no results found
	@Input() emptyMessage = 'Sorry! No results found.';
	// Search results to display
	searchResults: any[] = [];
	// Event when value selected
	@Output() selectValue = new EventEmitter<any>();
	// Value officially selected to display
	selectedDisplayValue: string = null;
	// Value officially selected as the form output
	selectedInternalValue: string = null;
	// Whether or not to show the search bar/results
	modal = false;
	// Keeps track of result if user tabs into it to select it
	private focusResult: any = null;

	// Callback for creating something.
	/** @TODO If there's a more "Angular" way to do this without too many limitations */
	@Input() onCreate: (value: string) => Observable<any> = () => of(null);

	ngOnInit() {
		// If parent inputted value, display that
		if (this.searchValue) {
			this.selectedDisplayValue = this.searchValue;
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

	/**
	 * Refresh the given results once we have more data
	 */
	refreshSearch() {
		this.onSearch(this.searchValue);
	}

	/**
	 * Refresh the search results when user is typing
	 * @param input Text in search input
	 */
	onSearch(input: string) {
		if (this.search) {
			this.searchResults = this.search.search(input);
		}
	}

	/**
	 * What happens when the user indicates they want to chose a given search result
	 * @param result Seach result selected
	 */
	onSelect(result: any) {
		console.log('on select', result);
		if (result) {
			this.searchValue = result[this.displayKey];
			this.selectedDisplayValue = result[this.displayKey];
			this.selectedInternalValue = result[this.valueKey];
		} else {
			this.searchValue = '';
			this.selectedDisplayValue = result;
			this.selectedInternalValue = result;
		}
		this.selectValue.emit(result);
		this.hideModal();
		this.refreshSearch();
	}

	/**
	 * If the display value isn't known (i.e. rehydrating a form from existing selection), then look for original display value
	 */
	mapInternalValueToDisplayValue() {
		console.log('map internal value', this.search);
		if (this.search) {
			for (const result of (this.search as any).list) {
				console.log('comapre', result[this.valueKey], this.valueKey, this.selectedInternalValue);
				if (result[this.valueKey] === this.selectedInternalValue) {
					console.log('we found match!!!');
					this.selectedDisplayValue = result[this.displayKey];
					return;
				}
			}
		}
	}

	/**
	 * If specified, what happens if the user clicks the "Create" button with text in the search field
	 */
	onCreateButton() {
		this.onCreate(this.searchValue).subscribe(
			result => {
				this.onSelect(result);
			},
			err => {
				console.log('Error creating thing!', err);
			}
		);
	}

	/**
	 * Handler when the user tabs to a given search result
	 * @param result Seach result selected
	 */
	onFocus(result: any) {
		this.focusResult = result;
	}

	/**
	 * Handler when the user tabs to a different given search result
	 */
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
	 * Add functionality as a Reactive Forms input
	 */

	writeValue(obj: string): void {
		console.log('selection', obj);
		// if (typeof obj === 'string') {
		// 	this.onSelect({ [this.valueKey]: obj });
		// } else {
		// 	this.onSelect(obj);
		// }
		this.selectedInternalValue = obj;
		this.mapInternalValueToDisplayValue();
	}

	registerOnChange(fn: any): void {
		this.selectValue.subscribe(selectedValue => {
			fn(this.selectedInternalValue);
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
