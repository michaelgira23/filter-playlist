import { AbstractControl } from '@angular/forms';

export function ValidateCriteria(control: AbstractControl) {
	// If all `purpose` fields are empty, then criteria as a whole is invalid
	if (control.value.every(value => !value.purpose.length)) {
		return { validCriteria: true };
	}
	return null;
}
