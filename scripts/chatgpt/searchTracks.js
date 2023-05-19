const SpotifyWebApi = require('spotify-web-api-node');

// Set up the Spotify API client

var client_id = '0e7ef13646c9410293a0119e652b35f7'; // Your client id
var client_secret = 'a00084c5c193478e9fc5d9a0c0e70058'; // Your secret

const spotifyApi = new SpotifyWebApi({
	clientId: client_id,
	clientSecret: client_secret
});


// Retrieve an access token
spotifyApi.clientCredentialsGrant()
	.then(data => {
		spotifyApi.setAccessToken(data.body['access_token']);

		// Set up the search query
		const query = 'Go Your Own Way';
		const options = {
			limit: 10, // maximum number of results to retrieve per request
			offset: 0 // initial offset, i.e., start from the beginning
		};

		// Search for tracks with the specified title
		spotifyApi.searchTracks(query, options)
			.then(data => {
				const tracks = data.body.tracks.items;
				console.log(`Found ${tracks.length} tracks:`);

				// Loop through the retrieved tracks and fetch the artist info for each one
				tracks.forEach(track => {
					const artist = track.artists[0];
					console.log(`- Track: ${track.name} (by ${artist.name})`);

					// Fetch the artist info
					spotifyApi.getArtist(artist.id)
						.then(data => {
							const genres = data.body.genres;
							console.log(`  Genres: ${genres.join(', ')}`);
						})
						.catch(err => {
							console.log('Error fetching artist info:', err);
						});
				});

				// Use pagination to retrieve more results
				const total = data.body.tracks.total;
				let remaining = total - tracks.length;
				let nextOffset = options.limit;
				console.log({total:total, remaining:remaining,nextOffset:nextOffset})

				while (remaining > 0) {
					options.offset = nextOffset;
					debugger
					spotifyApi.searchTracks(query, options)
						.then(data => {
							const tracks = data.body.tracks.items;
							console.log(`Found ${tracks.length} more tracks:`);

							tracks.forEach(track => {
								const artist = track.artists[0];
								console.log(`- Track: ${track.name} (by ${artist.name})`);

								// Fetch the artist info
								spotifyApi.getArtist(artist.id)
									.then(data => {
										const genres = data.body.genres;
										console.log(`  Genres: ${genres.join(', ')}`);
									})
									.catch(err => {
										console.log('Error fetching artist info:', err);
									});
							});

							debugger
							// Update the pagination variables
							remaining -= tracks.length;
							nextOffset += options.limit;
						})
						.catch(err => {
							console.log('Error fetching more tracks:', err);
							remaining = 0; // stop the pagination loop
						});
				}
			})
			.catch(err => {
				console.log('Error searching for tracks:', err);
			});
	})
	.catch(err => {
		console.log('Error retrieving access token:', err);
	});
