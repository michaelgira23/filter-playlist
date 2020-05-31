import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import * as functions from 'firebase-functions';
import _ from 'lodash';

import { admin } from '../firebase';
import { spotifyFactory } from '../spotify';

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());

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
		const { Spotify } = await spotifyFactory(uid);

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

/**
 * Create Spotify Playlist
 */
app.post('/playlists', async (req, res, next) => {
	try {
		// Get token from header
		const token = req.get('Authorization')?.substring('Bearer '.length);
		if (!token) throw new Error('No authorization token provided!');

		// Get Firebase token and Spotify username
		const decodedToken = await admin.auth().verifyIdToken(token);
		const uid = decodedToken.uid;
		const username = uid.substring('spotify:'.length);

		// Get Spotify playlists
		const { Spotify } = await spotifyFactory(uid);

		// Make sure provided name in request
		if (typeof req.body['name'] !== 'string') throw new Error('Please provide playlist name!');

		const result = await Spotify.createPlaylist(username, req.body['name'], {
			public: true,
			description: 'Auto-generated playlist created with Filter Playlist (https://filter-playlist.web.app)'
		});

		res.json(result.body);
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

export const spotify = functions.https.onRequest(app);