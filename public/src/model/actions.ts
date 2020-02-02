export interface Action {
	if: ActionIf;
	then: ActionThen;
}

/**
 * Define "if"s for triggering actions
 */

export enum ActionIfType {
	ALL_PASSED,
	NONE_PASSED,
	ANY_PASSED,
	ANY_FAILED,
	CRITERIA_N_PASSED,
	CRITERIA_N_FAILED
}

interface ActionIfBase {
	type: Omit<ActionIfType, ActionIfType.CRITERIA_N_PASSED | ActionIfType.CRITERIA_N_FAILED>;
}

interface ActionIfCriteria extends ActionIfBase {
	type: ActionIfType.CRITERIA_N_PASSED | ActionIfType.CRITERIA_N_FAILED;
	id: string;
}

type ActionIf = ActionIfBase | ActionIfCriteria;

/**
 * Define "then"s for what to do upon an action trigger
 */

export enum ActionThenType {
	ADD_TO_PLAYLIST,
	REMOVE_FROM_CURRENT_PLAYLIST
}

interface ActionThenBase {
	type: Omit<ActionThenType, ActionThenType.ADD_TO_PLAYLIST>;
}

interface ActionThenAddToPlaylist extends ActionThenBase {
	type: ActionThenType.ADD_TO_PLAYLIST;
	id: string;
}

type ActionThen = ActionThenBase | ActionThenAddToPlaylist;
