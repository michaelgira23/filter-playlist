import { ActionIfType, FirebaseAction } from '../../../public/src/model/actions';

export function parseIf(markedCriteria: MarkedCriteria, action: FirebaseAction) {
	switch (action.ifType) {
		case ActionIfType.ALL_PASSED:
			return Object.values(markedCriteria).every(c => c);
		case ActionIfType.ALL_FAILED:
			return Object.values(markedCriteria).every(c => !c);
		case ActionIfType.ANY_PASSED:
			return Object.values(markedCriteria).some(c => c);
		case ActionIfType.ANY_FAILED:
			return Object.values(markedCriteria).some(c => !c);
		case ActionIfType.CRITERIA_N_PASSED:
			return !!markedCriteria[action.ifType];
		case ActionIfType.CRITERIA_N_FAILED:
			return !markedCriteria[action.ifType];
	}
}

export interface MarkedCriteria {
	[id: string]: boolean;
}
