export interface FirebaseFilteredSong {
	createdAt: number;
	updatedAt: number;
	updatedBy: string;
	playlistId: string;
	criteriaPass: string[];
	criteriaFail: string[];
}
