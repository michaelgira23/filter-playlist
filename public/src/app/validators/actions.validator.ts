import { AbstractControl } from '@angular/forms';

import { Action, ActionThenType } from '../../model/actions';

export function ValidateActions(control: AbstractControl) {
	// If all `purpose` fields are empty, then criteria as a whole is invalid
	if (control.value.every(ensureActionParameters)) {
		return null;
	}
	return { validActions: true };
}

/**
 * Returns true if the provided (serialized) action is valid
 * @param action Serialized action
 */
export function ensureActionParameters(action: Action) {
	if (action.thenType === ActionThenType.ADD_TO_PLAYLIST && !action.thenId) {
		return false;
	}
	return true;
}
