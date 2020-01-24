export interface FilteredPlaylist {
	originId: string;
	criteria: Criteria[];
	filteredId: string;
}

export interface Criteria {
	purpose: string;
	details: string;
}
