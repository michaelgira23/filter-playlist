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

// Initialize Spotify API
const Spotify = new SpotifyWebApi({
	clientId: functions.config().spotify.client_id,
	clientSecret: functions.config().spotify.client_secret,
	redirectUri: `${host}/login`
});

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
app.get('/login', (req, res) => {
	// State ensures the same browser is logging in and receiving the token
	const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
	res.cookie('state', state.toString(), { maxAge: 3600000, secure: true, httpOnly: true });
	const authorizeURL = Spotify.createAuthorizeURL(OAUTH_SCOPES, state.toString());
	res.redirect(authorizeURL);
});

/**
 * Once user receives a token from Spotify, verify it and create a new Firebase auth account
 */
app.post('/token', async (req, res, next) => {
	try {
		if (!req.cookies.state) {
			throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
		} else if (req.cookies.state !== req.body.state) {
			throw new Error('State validation failed');
		}
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
			authResult.body['access_token'],
			authResult.body['refresh_token']
		);
		res.json({ token: firebaseToken });
	} catch (err) {
		// Express cannot handle asynchronous promise rejections
		next(err);
	}
});

async function createFirebaseAccount(spotifyUserId: string, email: string, username: string, profilePic: string | null, accessToken: string, refreshToken: string) {
	const uid = `spotify:${spotifyUserId}`;

	const tokenDoc = {
		accessToken,
		refreshToken
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
		admin.firestore().collection('users').doc(uid).set(tokenDoc),
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err);
	res.status(500).json({ message: err.message || err });
});

export const widgets = functions.https.onRequest(app);
