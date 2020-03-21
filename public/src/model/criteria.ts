export interface Criteria {
	id: string;
	purpose: string;
	description: string;
}

export interface FirebaseCriteria {
	createdAt: number;
	playlistId: string;
	order: number;
	purpose: string;
	description: string;
}
