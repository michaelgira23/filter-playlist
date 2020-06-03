import SpotifyWebApi from 'spotify-web-api-node';

import { ActionThenType, FirebaseAction } from '../../../public/src/model/actions';

export async function executeThen(spotifyApi: SpotifyWebApi, originId: string, songUri: string, action: FirebaseAction) {
	switch (action.thenType) {
		case ActionThenType.ADD_TO_PLAYLIST:
			if (action.thenId === null) {
				throw new Error('Action thenId expected to be set but was null!');
			}
			await spotifyAddToPlaylist(spotifyApi, action.thenId, songUri);
			break;
		case ActionThenType.REMOVE_FROM_CURRENT_PLAYLIST:
			await spotifyRemoveFromPlaylist(spotifyApi, originId, songUri);
			break;
	}
}

export async function undoThen(spotifyApi: SpotifyWebApi, originId: string, songUri: string, action: FirebaseAction) {
	switch (action.thenType) {
		case ActionThenType.ADD_TO_PLAYLIST:
			if (action.thenId === null) {
				throw new Error('Action thenId expected to be set but was null!');
			}
			await spotifyRemoveFromPlaylist(spotifyApi, action.thenId, songUri);
			break;
		case ActionThenType.REMOVE_FROM_CURRENT_PLAYLIST:
			await spotifyAddToPlaylist(spotifyApi, originId, songUri);
			break;
	}
}

async function spotifyAddToPlaylist(spotifyApi: SpotifyWebApi, originId: string, songUri: string) {
	await spotifyApi.addTracksToPlaylist(originId, [songUri]);
}

async function spotifyRemoveFromPlaylist(spotifyApi: SpotifyWebApi, originId: string, songUri: string) {
	await spotifyApi.removeTracksFromPlaylist(originId, [{ uri: songUri }]);
}
