import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import SpotifyWebApi from 'spotify-web-api-node';

import serviceAccount from '../service-account.json';

const debug = true;
const host = debug ? 'http://localhost:4200' : 'https://filter-playlist.web.app';

// Firebase service account for querying database
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount as any),
	databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
})

/**
 * Initialize Spotify API. Don't use same instance so that access tokens are not mixed up on alternate requests.
 * @param uid Firebase user UID. If set, will authenticate the Spotify instance.
 */
async function spotifyFactory(uid?: string) {
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
	console.log('expires in', credentials.expiresAt - currentTimestamp());
	if (currentTimestamp() >= credentials.expiresAt - 30) {
		const refreshResult = await Spotify.refreshAccessToken();
		const accessToken = refreshResult.body['access_token'];
		const expiresAt = currentTimestamp() + refreshResult.body['expires_in'];
		console.log('expires in', refreshResult.body['expires_in'], expiresAt - Date.now());
		Spotify.setAccessToken(accessToken);
		await credentialsDoc.update({ accessToken, expiresAt });
	}

	return Spotify;
}

/**
 * Return current timestamp in seconds
 */
function currentTimestamp() {
	return Math.floor(Date.now() / 1000);
}


// Scopes to request.
const OAUTH_SCOPES = [
	// Read email address
	'user-read-email',
	// Play music
	'streaming',
	// Read/write to user's playlists
	'playlist-read-collaborative',
	'playlist-modify-public',
	'playlist-read-private',
	'playlist-modify-private'
];

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());

/**
 * Initial starting point for Spotify OAuth process
 */
app.get('/login', async (req, res, next) => {
	try {
		// State ensures the same browser is logging in and receiving the token
		const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
		res.cookie('state', state.toString(), { maxAge: 3600000, secure: true, httpOnly: true });
		const Spotify = await spotifyFactory();
		const authorizeURL = Spotify.createAuthorizeURL(OAUTH_SCOPES, state.toString());
		res.redirect(authorizeURL);
	} catch (err) {
		// Express cannot handle asynchronous promise rejections
		next(err);
	}
});

/**
 * Once user receives a token from Spotify, verify it and create a new Firebase auth account
 */
app.post('/token', async (req, res, next) => {
	try {
		if (!req.cookies.state) {
			throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
		} else if (req.cookies.state !== req.body.state) {
			throw new Error('Invalid state! Please try again.');
		}
		const Spotify = await spotifyFactory();
		const authResult = await Spotify.authorizationCodeGrant(req.body.token);
		Spotify.setAccessToken(authResult.body['access_token']);
		const userResult = await Spotify.getMe();

		let profilePic = null;
		if (userResult.body['images'] && userResult.body['images'][0] && userResult.body['images'][0]['url']) {
			profilePic = userResult.body['images'][0]['url'];
		}

		const firebaseToken = await createFirebaseAccount(
			userResult.body['id'],
			userResult.body['email'],
			userResult.body['display_name'] as string,
			profilePic,
			authResult.body['refresh_token'],
			authResult.body['access_token'],
			currentTimestamp() + authResult.body['expires_in']
		);
		res.json({ token: firebaseToken });
	} catch (err) {
		// Express cannot handle asynchronous promise rejections
		next(err);
	}
});

/**
 * Create or update Firebase account for user, given their Spotify info
 * @param spotifyUserId Spotify ID
 * @param email Email
 * @param username Spotify username
 * @param profilePic URL to Spotify profile picture. Optional.
 * @param refreshToken Spotify refresh token
 * @param accessToken Spotify access token
 * @param expiresAt Timestamp that the access token expires
 */
async function createFirebaseAccount(spotifyUserId: string, email: string, username: string, profilePic: string | null, refreshToken: string, accessToken: string, expiresAt: number) {
	const uid = `spotify:${spotifyUserId}`;

	const tokenDoc = {
		refreshToken,
		accessToken,
		expiresAt
	};

	const userData: any = {
		displayName: username,
		email,
		emailVerified: true
	};
	if (profilePic) {
		userData.photoURL = profilePic;
	}

	await Promise.all([
		// Save Spotify API tokens in database
		admin.firestore().collection('spotifyCredentials').doc(uid).set(tokenDoc),
		// Add corresponding Firebase auth account
		admin.auth().updateUser(uid, userData)
			// If error, user does not exist. Create a new user.
			.catch(error => {
				if (error.code !== 'auth/user-not-found') {
					throw error;
				}
				return admin.auth().createUser({
					uid,
					...userData
				});
			})
	]);

	// Create auth token for user to log into Firebase
	return await admin.auth().createCustomToken(uid);
}

/**
 * Get a total list of the user's Spotify playlists
 */
app.get('/playlists', async (req, res, next) => {
	try {
		// Get token from header
		const token = req.get('Authorization')?.substring('Bearer '.length);
		if (!token) throw new Error('No authorization token provided!');

		// Get Firebase token and Spotify username
		const decodedToken = await admin.auth().verifyIdToken(token);
		const uid = decodedToken.uid;

		// Get Spotify playlists
		const Spotify = await spotifyFactory(uid);

		// Max amount of playlists we can get per API call
		const MAX_PLAYLIST_LIMIT = 50;
		// Cap offset at 100,000 because that's the API limit
		const MAX_PLAYLIST_OFFSET = 100000;

		let offset = 0;
		let playlistTotal = MAX_PLAYLIST_LIMIT;
		let playlists: any[] = [];

		do {
			if (offset > MAX_PLAYLIST_OFFSET) {
				break;
			}

			const playlistData = await Spotify.getUserPlaylists({
				offset,
				limit: MAX_PLAYLIST_LIMIT
			});
			playlistTotal = playlistData.body.total;
			playlists = [...playlists, ...playlistData.body.items];
			offset += MAX_PLAYLIST_LIMIT;
		} while (playlists.length < playlistTotal);

		res.json({ playlists });
	} catch (err) {
		// Express cannot handle asynchronous promise rejections
		next(err);
	}
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err);
	res.status(500).json({ message: err.message || err });
});

export const widgets = functions.https.onRequest(app);
