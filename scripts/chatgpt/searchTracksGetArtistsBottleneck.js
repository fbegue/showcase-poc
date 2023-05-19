const SpotifyWebApi = require('spotify-web-api-node');

var client_id = '0e7ef13646c9410293a0119e652b35f7'; // Your client id
var client_secret = 'a00084c5c193478e9fc5d9a0c0e70058'; // Your secret

const spotifyApi = new SpotifyWebApi({
	clientId: client_id,
	clientSecret: client_secret
});



const Bottleneck = require('bottleneck');
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 1000 }); // Rate-limit to 1 request per second

async function searchTracksByTitleWithArtists(title, limit, offset = 0) {
	try {
		const data = await limiter.schedule(() => spotifyApi.searchTracks(`track:"${title}"`, { limit, offset }));
		const tracks = data.body.tracks.items;

		const artists = [];
		for (const track of tracks) {
			for (const artist of track.artists) {
				const { body: artistData } = await limiter.schedule(() => spotifyApi.getArtist(artist.id));
				artists.push({ name: artistData.name, genres: artistData.genres });
			}
		}
		return { tracks, artists };
	} catch (error) {
		console.log('Something went wrong when searching for tracks', error);
		return { tracks: [], artists: [] };
	}
}

const title = 'Go Your Own Way';
const limit = 10; // Retrieve up to 10 tracks
let offset = 0;

let exec = async function(){

	try{

		let data =await spotifyApi.clientCredentialsGrant();
		spotifyApi.setAccessToken(data.body.access_token);
		return (async function() {
			const results = [];
			let hasNextPage = true;

			while (hasNextPage) {
				const { tracks, artists } = await searchTracksByTitleWithArtists(title, limit, offset);
				debugger;
				results.push(...tracks.map((track, i) => ({
					name: track.name,
					artists: track.artists.map((artist, j) => ({
						name: artist.name,
						genres: artists[i * track.artists.length + j].genres
					})),
					album: track.album.name
				})));

				offset += limit;
				hasNextPage = tracks.length === limit;
			}

			console.log(results);
		})();

	}catch(e){	console.log('Something went wrong when retrieving an access token', error);}

	// Retrieve an access token
}

exec()
	.then(r=>{
		debugger
	},e=>{
		debugger
	})

