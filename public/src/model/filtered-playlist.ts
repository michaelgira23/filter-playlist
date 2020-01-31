export interface FilteredPlaylist {
	originId: string;
	criteria: Criteria[];
	filteredId: string;
	createdBy: string;
}

export interface Criteria {
	id: string;
	purpose: string;
	details: string;
}
