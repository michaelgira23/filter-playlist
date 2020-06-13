(async () => {
	const currentRes = require('../current-res.json');
	const newRes = require('../new-res.json');

	const currentIds = currentRes.songs.map(song => song.track.uri);
	const newIds = newRes.songs.map(song => song.track.uri);

	const toDelete = currentIds.filter(id => !newIds.includes(id));
	// const toDelete = ['spotify:track:0OgGn1ofaj55l2PcihQQGV'];
	console.log(toDelete);

	const firebaseAdmin = require('firebase-admin');

	const serviceAccount = require('./service-account.json');

	// Firebase service account for querying database
	const admin = firebaseAdmin.initializeApp({
		credential: firebaseAdmin.credential.cert(serviceAccount),
		databaseURL: `https://${process.env.GCLOUD_PROJECT}.firebaseio.com`
	});

	for (const id of toDelete) {
		const song = await admin.firestore()
			.collection('filteredPlaylists').doc('F9Li5fWnaqAyRP5hxZzd').collection('filteredSongs').doc(id)
			// .collection('filteredPlaylists').doc('O4wgvRIM6EM9LVgiujAT').collection('filteredSongs').doc(id)
			// .where('playlistId', '==', filteredPlaylistId)
			// .orderBy('order')
			.get();

		if (!song.exists) {
			continue;
		}

		// /filteredPlaylists/F9Li5fWnaqAyRP5hxZzd/filteredSongs/spotify:track:6d8MHAb3LSuAz42yyDM4q1

		// await song.ref.update({
		// 	markedCriteria: {
		// 		// '8MwliCf7ugJg5Nsmr1YTb': true
		// 		'6B1njQw4ZkvOm5YSVoAu': false,
		// 		'juuuatwnfrDkcVCqyrWG': false
		// 	}
		// });

		await song.ref.delete();

		// console.log(song.data());

		// return;
	}
})();
