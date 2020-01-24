import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import * as functions from 'firebase-functions';
import SpotifyWebApi from 'spotify-web-api-node';

const debug = false;
const host = debug ? 'http://localhost:4200' : `https://${process.env.GCLOUD_PROJECT}.web.app`;

const spotifyApi = new SpotifyWebApi({
	clientId: functions.config().spotify.client_id,
	clientSecret: functions.config().spotify.client_secret,
	redirectUri: `${host}/login`
});

// Scopes to request.
const OAUTH_SCOPES = ['user-read-email'];

export const helloWorld = functions.https.onRequest((request, response) => {
	response.send("Hello from Firebase!");
});

export const login = functions.https.onRequest((req, res) => {
	cookieParser()(req, res, () => {
		const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
		console.log('Verification state', state);
		res.cookie('state', state.toString(), { maxAge: 3600000, secure: true, httpOnly: true });
		const authorizeURL = spotifyApi.createAuthorizeURL(OAUTH_SCOPES, state.toString());
		res.redirect(authorizeURL);
	});
});
