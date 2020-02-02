export interface Action {
	if: ActionIf;
	then: ActionThen;
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

interface ActionIfBase {
	type: Omit<ActionIfType, ActionIfType.CRITERIA_N_PASSED | ActionIfType.CRITERIA_N_FAILED>;
}

export interface ActionIfCriteria extends ActionIfBase {
	type: ActionIfType.CRITERIA_N_PASSED | ActionIfType.CRITERIA_N_FAILED;
	id: string;
}

type ActionIf = ActionIfBase | ActionIfCriteria;

/**
 * Define "then"s for what to do upon an action trigger
 */

export enum ActionThenType {
	ADD_TO_PLAYLIST = 'ADD_TO_PLAYLIST',
	REMOVE_FROM_CURRENT_PLAYLIST = 'REMOVE_FROM_CURRENT_PLAYLIST'
}

interface ActionThenBase {
	type: ActionThenType.REMOVE_FROM_CURRENT_PLAYLIST;
}

export interface ActionThenAddToPlaylist {
	type: ActionThenType.ADD_TO_PLAYLIST;
	id: string;
}

type ActionThen = ActionThenBase | ActionThenAddToPlaylist;
