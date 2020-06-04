// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	firebase: {
		apiKey: 'AIzaSyAShc3QStFtr1VMusoJYTYZFHlb_IkcNSc',
		authDomain: 'filter-playlist.firebaseapp.com',
		// databaseURL: 'https://filter-playlist.firebaseio.com',
		databaseURL: 'http://localhost:8080',
		projectId: 'filter-playlist',
		storageBucket: 'filter-playlist.appspot.com',
		messagingSenderId: '767916801008',
		appId: '1:767916801008:web:10f5433284cb660dc1fb35',
		measurementId: 'G-33YVXNK4E0'
	},
	// firebaseFunctionsHost: 'https://us-central1-filter-playlist.cloudfunctions.net'
	firebaseFunctionsHost: 'http://localhost:5001/filter-playlist/us-central1'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error'; // Included with Angular CLI.
