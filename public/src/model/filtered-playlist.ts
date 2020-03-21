import { Action } from './actions';
import { Criteria } from './criteria';

export interface FilteredPlaylist extends UpsertFilteredPlaylist {
	id: string;
}

export interface UpsertFilteredPlaylist extends FirebaseFilteredPlaylist {
	id?: string;
	criteria: Criteria[];
	actions: Action[];
}

export interface FirebaseFilteredPlaylist {
	createdAt: number;
	createdBy: string;
	originId: string;
}
