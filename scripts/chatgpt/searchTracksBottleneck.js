const SpotifyWebApi = require('spotify-web-api-node');
const Bottleneck = require('bottleneck');

// Set up the Spotify API client
const spotifyApi = new SpotifyWebApi();

spotifyApi.setAccessToken('BQBv4vbJGuE6sHgF3FqTuFxmpusuotFQhlN64HFPIu9jFKVd3qm_aqjF5BBzHH22zotdaV2rwIb9OLPxxIS_PWEIMVEZw7dVbsJcNRhG6QkCc8vDv4BTBKuqo9ip6BfGcRS8fJtUwqNJRNcxpx1T7H379hHQd_LK8cJX5C4_PixAEivjVCvjkvM3vr-F5w2Jgczqhcq9dHXgGc-MuCuneP2kIlAY3iIKSBtYwPUvq9fxtu9fj2Lj8RZQKC6MQOSlRTS_8TUrPaDha8sE9QpuqtmG86lEdmTW-xbnlj9O9cfX1009jnKCgy1iPEwNCezrGhOk');

// Set up rate-limiting with bottleneck library
const limiter = new Bottleneck({
	maxConcurrent: 1, // Number of requests to run in parallel
	minTime: 1000, // Minimum time to wait between each request (in milliseconds)
});

// Define a function to search for tracks and fetch artist info
const searchTracks = async (query, limit, offset) => {
	// Set up options for the search request
	const options = {
		limit: limit,
		offset: offset,
		type: 'track',
	};

	// Use the Spotify API client to search for tracks
	const data = await limiter.schedule(() => spotifyApi.searchTracks(query, options));

	// Extract the relevant track and artist data from the response
	const tracks = data.body.tracks.items.map((track) => {
		const artists = track.artists.map((artist) => {
			return {
				name: artist.name,
				genres: artist.genres,
			};
		});
		return {
			name: track.name,
			artists: artists,
		};
	});

	return tracks;
};

let max = 50;
// Define a function to search for tracks and artist info with pagination
const searchTracksWithPagination = async (query, limit, offset, results = []) => {
	// Search for tracks with the given query and pagination options
	const tracks = await searchTracks(query, limit, offset);

	// Concatenate the new results with the previous results
	results = results.concat(tracks);

	// If there are more tracks to fetch, recursively call this function with updated pagination options
	if (tracks.length === limit && !(results.length > max)) {
		console.log(offset + limit)
		return searchTracksWithPagination(query, limit, offset + limit, results);
	}
debugger
	return results;
};

// Search for tracks with the title "Go Your Own Way" and fetch artist info with pagination
console.log("start")
searchTracksWithPagination('Go Your Own Way', 20, 0)
	.then((tracks) => {
		console.log(tracks);
	})
	.catch((err) => {
		console.log('Error: ', err);
	});
