import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import express from 'express';
import * as functions from 'firebase-functions';
import _ from 'lodash';

import { OAUTH_SCOPES } from '../config';
import { admin } from '../firebase';
import { spotifyFactory } from '../spotify';
import { currentTimestamp } from '../utils';

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
		const { Spotify } = await spotifyFactory();
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
		const { Spotify } = await spotifyFactory();
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
 * Get Spotify access token for using API
 */
app.get('/token', async (req, res, next) => {
	try {
		// Get token from header
		const token = req.get('Authorization')?.substring('Bearer '.length);
		if (!token) throw new Error('No authorization token provided!');

		// Get Firebase token and Spotify username
		const decodedToken = await admin.auth().verifyIdToken(token);
		const uid = decodedToken.uid;

		// Get Spotify instance
		const { Spotify, expiresAt } = await spotifyFactory(uid);

		res.json({
			accessToken: Spotify.getAccessToken(),
			expiresAt
		});
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err);
	res.status(500).json({ message: err.message || err });
});

export const auth = functions.https.onRequest(app);
