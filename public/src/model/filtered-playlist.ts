export interface FilteredPlaylist {
	originId: string;
	criteria: { [id: string]: Criteria };
	filteredId: string;
	createdBy: string;
}

export interface Criteria {
	purpose: string;
	details: string;
}
