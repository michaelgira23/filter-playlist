export interface Action {
	ifType: ActionIfType;
	ifId: string | null;
	thenType: ActionThenType;
	thenId: string | null;
}

/**
 * Define "if"s for triggering actions
 */
export enum ActionIfType {
	ALL_PASSED = 'ALL_PASSED',
	ALL_FAILED = 'ALL_FAILED',
	ANY_PASSED = 'ANY_PASSED',
	ANY_FAILED = 'ANY_FAILED',
	CRITERIA_N_PASSED = 'CRITERIA_N_PASSED',
	CRITERIA_N_FAILED = 'CRITERIA_N_FAILED'
}

/**
 * Define "then"s for what to do upon an action trigger
 */
export enum ActionThenType {
	ADD_TO_PLAYLIST = 'ADD_TO_PLAYLIST',
	REMOVE_FROM_CURRENT_PLAYLIST = 'REMOVE_FROM_CURRENT_PLAYLIST'
}
