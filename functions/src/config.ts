import * as functions from 'firebase-functions';

export const isProduction = functions.config().environment.production === 'true';
export const host = isProduction ? 'https://filter-playlist.web.app' : 'http://localhost:4200';

// Spotify OAuth scopes to request
export const OAUTH_SCOPES = [
	// Read email address
	'user-read-email',
	'user-read-private',
	// Play music
	'streaming',
	'user-modify-playback-state',
	// Read/write to user's playlists
	'playlist-read-collaborative',
	'playlist-modify-public',
	'playlist-read-private',
	'playlist-modify-private'
];
