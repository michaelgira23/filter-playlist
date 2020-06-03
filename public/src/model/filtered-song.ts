export interface FirebaseFilteredSong {
	updatedAt: number;
	updatedBy: string;
	markedCriteria: FirebaseMarkedCriteria;
	executedActions: FirebaseExecutedActions;
}

export interface FirebaseMarkedCriteria {
	[criteriaId: string]: boolean;
}

export interface FirebaseExecutedActions {
	[actionId: string]: boolean;
}
