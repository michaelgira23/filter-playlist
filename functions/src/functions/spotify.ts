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

		// Offset of already fetched playlists
		let offset = 0;
		// Total number of playlists the user has
		let playlistTotal = 0;

		let playlists: SpotifyApi.PlaylistObjectSimplified[] = [];

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
 * Get a total list of songs from a filtered playlist
 */
app.get('/songs/:filteredPlaylistId', async (req, res, next) => {
	try {
		// Get token from header
		const token = req.get('Authorization')?.substring('Bearer '.length);
		if (!token) throw new Error('No authorization token provided!');

		// Get Firebase token and Spotify username
		const decodedToken = await admin.auth().verifyIdToken(token);
		const uid = decodedToken.uid;

		// Get the filtered playlist
		const { filteredPlaylistId } = req.params;
		const filteredPlaylistDoc = admin.firestore().collection('filteredPlaylists').doc(filteredPlaylistId);
		const filteredPlaylist = await (await filteredPlaylistDoc.get()).data();

		// Check if user is authorized to access this filtered playlist
		if (!filteredPlaylist || filteredPlaylist.createdBy !== uid) {
			throw new Error('You are not authorized to view this filtered playlist!');
		}

		// Get Spotify playlists
		const { Spotify } = await spotifyFactory(filteredPlaylist.createdBy);

		// Max amount of songs we can get per API call
		const MAX_SONG_LIMIT = 100;

		// Get the user's current market/country for songs
		const spotifyUser = await (await Spotify.getMe()).body;

		const playlist = await (await Spotify.getPlaylist(filteredPlaylist.originId, { market: spotifyUser.country })).body;
		let songs: SpotifyApi.PlaylistTrackObject[] = playlist.tracks.items;

		// Total number of playlists the user has
		const songTotal = playlist.tracks.total;

		// Create array of API requests to execute in parallel
		const songQueries = [];
		for (let offset = songs.length; offset < songTotal; offset += MAX_SONG_LIMIT) {
			songQueries.push(
				Spotify.getPlaylistTracks(filteredPlaylist.originId, {
					offset,
					limit: MAX_SONG_LIMIT,
					market: spotifyUser.country
				})
			);
		}

		const songQueriesResult = await (await Promise.all(songQueries)).map(result => result.body.items);
		songs = songs.concat(...songQueriesResult);

		res.json({ playlist, songs });
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
