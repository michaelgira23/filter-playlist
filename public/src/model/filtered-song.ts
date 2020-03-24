export interface FirebaseFilteredSong {
	updatedAt: number;
	updatedBy: string;
	markedCriteria: FirebaseMarkedCriteria;
}

export interface FirebaseMarkedCriteria {
	[criteriaId: string]: boolean;
}
