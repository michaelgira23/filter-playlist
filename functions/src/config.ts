export const debug = true;
export const host = debug ? 'http://localhost:4200' : 'https://filter-playlist.web.app';

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
