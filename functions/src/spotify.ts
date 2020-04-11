import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import SpotifyWebApi from 'spotify-web-api-node';

import { host } from './config';
import { currentTimestamp } from './utils';

/**
 * Initialize Spotify API. Don't use same instance so that access tokens are not mixed up on alternate requests.
 * @param uid Firebase user UID. If set, will authenticate the Spotify instance.
 */
export async function spotifyFactory(uid?: string) {
	const Spotify = new SpotifyWebApi({
		clientId: functions.config().spotify.client_id,
		clientSecret: functions.config().spotify.client_secret,
		redirectUri: `${host}/login`
	});

	if (uid) {
		return await authenticateSpotify(Spotify, uid);
	} else {
		return Spotify;
	}
}

/**
 * Authenticate the Spotify object by setting tokens and optionally refreshing any expired access token
 * @param Spotify Spotify instance
 * @param uid
 */
async function authenticateSpotify(Spotify: SpotifyWebApi, uid: string) {
	const credentialsDoc = admin.firestore().collection('spotifyCredentials').doc(uid);
	const credentials = await (await credentialsDoc.get()).data();
	if (!credentials) throw new Error('User\'s Spotify credentials not in database!');

	Spotify.setRefreshToken(credentials.refreshToken);
	Spotify.setAccessToken(credentials.accessToken);

	// Refresh access token if it expired (or will expire in 30 seconds)
	if (currentTimestamp() >= credentials.expiresAt - 30) {
		const refreshResult = await Spotify.refreshAccessToken();
		const accessToken = refreshResult.body['access_token'];
		const expiresAt = currentTimestamp() + refreshResult.body['expires_in'];
		Spotify.setAccessToken(accessToken);
		await credentialsDoc.update({ accessToken, expiresAt });
	}

	return Spotify;
}
