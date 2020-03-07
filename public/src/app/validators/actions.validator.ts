import { AbstractControl } from '@angular/forms';

import { SerializedAction, ActionThenType } from '../../model/actions';

export function ValidateActions(control: AbstractControl) {
	// If all `purpose` fields are empty, then criteria as a whole is invalid
	if (control.value.every(ensureActionParameters)) {
		return { validActions: true };
	}
	return null;
}

function ensureActionParameters(action: SerializedAction) {
	if (action.thenType === ActionThenType.ADD_TO_PLAYLIST && !action.thenId) {
		return { actionThenId: true };
	}
	return null;
}
