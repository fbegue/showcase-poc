var playlist_api = require('../apis/spotify_api/playlist_api')
var spotify_api = require('../apis/spotify_api')
let resolver = require("../resolver")
var giveMePayloads = require('../utility/utility').giveMePayloads
const FuzzySet = require('fuzzyset')
var Bottleneck = require("bottleneck");
var network_utility = require('../utility/network_utility')
var items = require('../scripts/experience-columbus-scraper/experienceColumbusParsed')
//var _ = require('./spotify_api')._
//todo: don't know why the fuck old lodash imports don't work here
//works fine in spotify_api @ test (getMySavedTracks)
var difference = require('lodash').difference
var uniqBy = require('lodash').uniqBy
var uniq = require('lodash').uniq
var _ = require('lodash')
var fs = require("fs")
var db_mongo_api = require('./db_mongo_api')
var artistGroupsMap = require("../scripts/gpt.artists-group-map")
let notOnSpotify = require("../scripts/not-on-spotify")

//var songs = require('../scripts/ripYoutubePlaylist/songs').songs

// var limiter = new Bottleneck({
// 	 maxConcurrent: 10,
// 	//minTime: 100,
// 	//testing: at 86~89 it starts failing
// 	trackDoneStatus: true
// });

var me = module.exports;
// var sleep =  function(){
//     return new Promise(function(done, fail) {
// 		console.log('sleeping..');
//
// 		setTimeout(e =>{done()	},2000)
//     })
// }

//todo: pretty damn slow - don't know if that's bc...
//- my limiters are ordered weirdly?
//- I don't get a real retry-after when using spotifyAPI (lots of 5000s ?)
//- could just take awhile?

//todo: some weird webstorm bug treating this as non-async sometimes?
//when debugging, payloads are always out of order?

/**helpers*/

var matchArtistOfGroup = function (strArtist, strArtistMatch) {

	if (artistGroupsMap[strArtist]) {
		return !(artistGroupsMap[strArtist].indexOf(strArtistMatch) === -1)
	}
}

//track or album item
var processFuzzy = function (str, matchStr) {


	var a = FuzzySet();

	a.add(str);
	//if null, short-circuit below
	var missing = a.get(matchStr) === null;

	// sanity check = if the strings contain each other
	//todo: for some reason fuzzy is missing stuff like "Prince" "Prince and the Revolution"???
	var contains = str.indexOf(matchStr) !== -1 || matchStr.indexOf(str) !== -1;

	if (contains) {
		return {matchReason: "contains"}
	} else if (matchArtistOfGroup(str, matchStr)) {
		return {matchReason: "matchArtistOfGroup"}
	} else if (missing) {
		return false
	} else {
		//does value pass confidence interval check
		var getValue = a.get(matchStr);
		if (getValue < .5) {
			return false;
		} else {
			return {matchReason: "interval confidence"};
		}
	}
}

var _getArtistTopTracks = async function (req, artistId) {
	try {
		var res = await req.body.spotifyApi.getArtistTopTracks(artistId, 'ES')
		return res.body.tracks
	} catch (e) {
		throw e
	}
}

var getArtistTopTracks = function (req, artistOb, sampleSize) {
	return new Promise(function (done, fail) {
		//console.log("getArtistTopTracks");
		//console.log("$getArtistTopTracks",req.body.id);

		req.body.spotifyApi.getArtistTopTracks(artistOb.id, 'ES')
			.then(r => {
				var ids = r.body.tracks.slice(0, sampleSize).map(r => {
					return {id: r.id, name: r.name}
				})
				done(ids)
				//note: on failure, still resolve w/ notice as such
			}, e => {

				console.error(e);
				done({failure: e})
			})
		//.then(r => { res.send(r.body.tracks)},err =>{res.status(500).send(err)})
	})
}

me.resolveArtists = async function (req, res) {

	console.log("resolveArtists", items.length)

	//note: no idea what this was about lol
	let removeStringsWithDays = function () {
		var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
		var withDays = items.filter(i => {
			var found = false;
			for (var x = 0; x < days.length; x++) {
				found = i.Title.indexOf(days[x]) !== -1
				if (found) {
					break
				}
			}
			return found;
		})
		//todo: what the fuck is going on with lodash
		console.log("withDays", withDays.length)

		items = difference(items, withDays);
		debugger
		items.forEach(i => {
			i.name = i.Title;
			i.type = "artist"
		})
	}
	//removeStringsWithDays()

	//testing:
	//albums = albums.slice(0,150)
	//items = items.slice(0,1)

	//debugger
	//albums = albums.filter(a =>{return a.name === "1999"})

	try {
		var task = async function (item) {
			try {


				var response = await network_utility.limiter.schedule(spotify_api.searchSpotify, req, item)
				//todo: change depending on context
				var resultItems = response?.result?.artists?.items

				if (resultItems.length > 0) {

					var processFuzzy = function (item, artist) {

						var a = FuzzySet();

						a.add(item.artist);
						var missing = a.get(artist.name) === null;
						var get = false;
						//for some reason fuzzy is missing stuff like "Prince" "Prince and the Revolution"???
						var contains = artist.name.indexOf(item.artist) !== -1 || item.artist.indexOf(artist.name) !== -1

						// !missing ? get =  a.get(artist.name)[0][0]:{}
						!missing ? get = a.get(artist.name) : {}
						if (!contains && (missing || get < .5)) {
							//rejectedMatches.push([item.name, artist.name])
							//debugger
							return false;
						} else {
							return true;
						}
					}


					var matchResult = false;
					//todo:
					matchResult = true;
					// for(var x = 0; x <resultItems.length; x++){
					// 	var item = resultItems[x]
					// 	if(processFuzzy(item,{name:album.artists[0].name})){
					// 		matchResult ={item:item,result:album.artists[0].name}
					// 	}
					// }

					if (notOnSpotify.indexOf(item.artist) !== -1) {
						matchResult = {item: item, result: resultItems, flag: "not on Spotify"}
						return matchResult
					} else if (!matchResult) {
						resultItems.forEach(item => {
							item.available_markets = null;
						});
						matchResult = {item: item, result: resultItems, flag: "failed"}
						// console.log("bad album artist match: " +  response.result.albums.items[0].artists[0].name + " | " +item.artist);
						console.log("bad album artist match: ", JSON.stringify(matchResult, null, 4));

						return matchResult
					} else {
						//todo: need to fetch an album first

						var trackOb = [[null]]
						//var trackOb = await network_utility.limiter.schedule(spotify_api.resolveAlbumTracks,req,resultItems[0].id)

						// console.log("id",response.result.albums.items[0].artists[0].id);
						var _getArtist = async function (artistId) {
							try {
								return await req.body.spotifyApi.getArtist(artistId);
							} catch (e) {
								debugger;
								throw e
							}
						}

						var artistOb = await network_utility.limiter.schedule(_getArtist, resultItems[0].id)
						//console.log("artistOb",artistOb);

						//note: how many tracks
						return {
							query: item,
							tracks: trackOb[0].slice(0, 2),
							artist: artistOb.body,
							album: resultItems[0]
						}
					}

				} else {
					return response;
				}

			} catch (e) {
				debugger
			}
		}

		//testing:
		//albums = albums.slice(0,10)
		//albums = albums.slice(0,1)


		var ps = items.map(task);

		//var ps = []
		// ps.push(network_utility.limiter.schedule(spotify_api.searchSpotify,req,albums[0]))
		//ps.push(spotify_api.searchSpotify(req,albums[0]))

		//testing:

		var results = await Promise.all(ps)

		//todo:move up
		const IM = require('../utility/inMemory')

		var _ = require('lodash')

		function familyFreq(a) {

			var ret = null;

			//a = JSON.parse(JSON.stringify(a));
			//console.log(JSON.parse(JSON.stringify(a)));
			// console.log("familyFreq",a.genres);
			// console.log("familyFreq",a.genres.length >0);

			if (a.genres && a.genres.length > 0) {
				var fmap = {};
				for (var z = 0; z < a.genres.length; z++) {
					if (a.genres[z].family_name) {
						if (!(fmap[a.genres[z].family_name])) {
							fmap[a.genres[z].family_name] = 1
						} else {
							fmap[a.genres[z].family_name]++;
						}
					}
				}

				//console.log("$fmap",fmap);

				//check the family map defined and see who has the highest score
				if (!(_.isEmpty(fmap))) {
					//convert map to array (uses entries and ES6 'computed property names')
					//and find the max
					var arr = [];
					Object.entries(fmap).forEach(tup => {
						var r = {[tup[0]]: tup[1]};
						arr.push(r);
					});
					//todo: could offer this
					var m = _.maxBy(arr, function (r) {
						return Object.values(r)[0]
					});
					var f = Object.keys(m)[0];
					//console.log("%", f);
					ret = f;
				}
			} else {
				//if
				console.warn("no genres!", a.name);
			}
			ret ? a.familyAgg = ret : {};
			return ret;
		}

		var results_pre = results.length + ""
		var failed = results.filter(r => {
			return r.flag
		})
		results = results.filter(r => {
			return !r.flag
		})
		//todo:
		var unknown = results.filter(r => {
			return r.failure
		})
		results = results.filter(r => {
			return !r.failure
		})

		console.log("bad requests", failed)
		console.log("bad requests ratio", failed.length + "/" + results_pre);
		console.log("unknown requests", unknown)
		debugger

		results.forEach(r => {
			if (!r.artist.genres) {
				debugger
			}
			r.artist.genres = r.artist.genres.map(gString => {
				return IM.genresQualifiedMap[gString]
			})
			r.artist.genres = r.artist.genres.filter(g => {
				return g !== undefined
			})
			r.artist.familyAgg = familyFreq(r.artist)

		})

		function capitalizeFirstLetter(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		const sortedResultsFamily = results.reduce((groups, album) => {
			//const splitString = email.split('@');
			//const account = splitString[0];
			const domain = album.artist.familyAgg


			if (!groups[domain]) groups[domain] = [];

			groups[domain].push(album);
			return groups;
		}, {});

		var myRegexpYear = /(.*)-(.*)-(.*)/g;
		var myRegexpMonth = /(.*)-(.*)/g;

		const getDecade = (album) => {
			var m = null;
			if (album.release_date_precision === 'year') {
				m = album.release_date
			} else if (album.release_date_precision === 'month') {
				m = new RegExp(myRegexpMonth).exec(album.release_date)[1]
			} else {
				m = new RegExp(myRegexpYear).exec(album.release_date)[1]

			}
			// if(m === null){
			// 	debugger
			// }

			m = parseInt(m)
			switch (true) {
				case m < 1970:
					return 60
				case m >= 1970 && m < 1980:
					return 70
				case m >= 1980 && m < 1990:
					return 80
				case m >= 1990 && m < 2000:
					return 90
				case m >= 2000 && m < 2030:
					return 2030
				default:
					console.error('no date!', m)
					debugger
				// code block
			}
		}

		const sortedResultsDecade = results.reduce((groups, ob) => {
			//const splitString = email.split('@');
			//const account = splitString[0];
			const domain = getDecade(ob.album)


			if (!groups[domain]) groups[domain] = [];

			groups[domain].push(ob);
			return groups;
		}, {});

		var newPlaylistIds = [];
		const makePopPlaylist = async function (domain, songs) {
			domain = capitalizeFirstLetter(domain)
			try {
				var pname = 'RollingStonesTop500' + (domain ? '-' + domain : "")
				var desc = {'description': 'My description', 'public': true};

				var _createPlaylist = async function (id, pname, desc) {
					try {
						var res = await req.body.spotifyApi.createPlaylist(id, pname, desc);
						return res
					} catch (e) {
						throw e
					}
				}

				var r = await network_utility.limiter.schedule(_createPlaylist, req.body.user.id, pname, desc);
				console.log("new playlist", r.body.id)

				newPlaylistIds = newPlaylistIds.concat(r.body.id)
				var _addTracksToPlaylist = async function (id, payload) {
					try {
						var res = await req.body.spotifyApi.addTracksToPlaylist(id, payload);
						return res
					} catch (e) {
						throw e
					}
				}
				var fitTry = async function (req, id, payload) {
					try {
						//payload = payload.slice(0,5)
						var res = await network_utility.limiter.schedule(_addTracksToPlaylist, id, payload)
						//debugger
						return res
					} catch (e) {
						//debugger
						throw e
					}
				}
				var task = async function (payload) {
					try {
						var response = await fitTry(req, r.body.id, payload)
						//debugger
						return response;
					} catch (e) {
						//debugger
						throw e
					}
				}

				var payloads = giveMePayloads(songs, 100)
				var proms = payloads.map(task);

				//var proms = payloads.map(network_utility.limiter.schedule(fitTry,req,r.body.id,{ limit : 50}));
				return await Promise.all(proms)
				//return r.body.id


			} catch (e) {
				console.error(e)
				throw(e)
			}
		}

		//note: use sorted or not
		//var sorted = false
		//var sorted = sortedResultsDecade
		var sorted = sortedResultsFamily

		if (sorted) {

			Object.keys(sorted).forEach(domain => {
				var songs = [];
				sorted[domain].forEach(r => {
					songs = songs.concat(r.tracks)
				})
				console.log("domain:" + domain, songs.length);

				var fucked = songs.filter(s => {
					return s === undefined
				})
				console.log("fucked", fucked.length);
				//debugger
				songs = songs.filter(s => {
					return s !== undefined
				})
				songs = songs.map(s => "spotify:track:" + s.id);

				network_utility.limiter.schedule(makePopPlaylist, domain, songs)
					.then(r => {
						//todo: check add results
						console.log("new playlist ids", newPlaylistIds)
						console.log("finished!");
					}, e => {
						console.error(e);
						debugger
					})

			})

		} else {
			//note: use unsorted (single domain = blank)
			var songs = [];
			results.forEach(r => {
				songs = songs.concat(r.tracks)
			})
			console.log("songs", songs.length);

			var fucked = songs.filter(s => {
				return s === undefined
			})
			console.log("fucked", fucked.length);

			songs = songs.filter(s => {
				return s !== undefined
			})
			songs = songs.map(s => "spotify:track:" + s.id);

			var r = await makePopPlaylist("", songs)
			//todo: check add results
			console.log("new playlist ids", newPlaylistIds)
			console.log("finished!");

		}

		//var atres = await network_utility.limiter.schedule(fitTry,req,r.body.id,{ limit : 50})
		// req.body.spotifyApi.addTracksToPlaylist(r.body.id, payload)
		// 	.then(function (data) {
		// 		console.log('Added tracks to playlist!');
		// 	}, function (err) {
		// 		console.log('Something went wrong!', err);
		// 	});


	} catch (e) {
		debugger
	}

}


// var parsed = require('../scripts/songkick-scraper/Los_Angeles_Songkick_2022-11-12_to_2022-11-19_parsed');
var parsed = require('../scripts/songkick-scraper/Los_Angeles_Songkick_parsed__update111222.json');
var artistSongkickArr = require('../scripts/songkick-scraper/LA_fetchMetroEvents_result').artist_artistSongkick_committed;

me.compare_fetchMetroEvents_artists_to_input_json_events = async function (req, res) {
	var matched = [];
	var no_matched = [];

	artistSongkickArr.forEach(a => {
		var breakIt = false;
		for (var x = 0; x < parsed.length; x++) {
			var thisOne = parsed[x];
			if (JSON.stringify(thisOne).includes(a.displayName)) {

				matched.push(thisOne)
				breakIt = true;
				break;
			}
		}
		if (!breakIt) {
			debugger
			no_matched.push(a)
		}

	})
	console.log(matched.length)
	console.log(no_matched.length)
	debugger
}

/**playlists*/

let makeAndPopulatePlaylist = async function (req, playlistTitle, songs) {

	try {

		var desc = {'description': 'My description', 'public': true};
		var _createPlaylist = async function (id, playlistTitle, desc) {
			try {
				var res = await req.body.spotifyApi.createPlaylist(id, playlistTitle, desc);
				return res
			} catch (e) {
				throw e
			}
		}

		var r = await network_utility.limiter.schedule(_createPlaylist, req.body.user.id, playlistTitle, desc);
		console.log("new playlist id:", r.body.id)

		var _addTracksToPlaylist = async function (id, payload) {
			try {
				payload = payload.map(s => "spotify:track:" + s.id);
				var res = await req.body.spotifyApi.addTracksToPlaylist(id, payload);
				return res
			} catch (e) {
				throw e
			}
		}

		var fitTry = async function (req, id, payload) {
			try {
				//payload = payload.slice(0,5)
				var res = await network_utility.limiter.schedule(_addTracksToPlaylist, id, payload)
				//debugger
				return res
			} catch (e) {
				//debugger
				throw e
			}
		}
		var task = async function (payload) {
			try {
				var response = await fitTry(req, r.body.id, payload)
				//debugger
				return response;
			} catch (e) {
				//debugger
				throw e
			}
		}

		var payloads = giveMePayloads(songs, 100)
		var proms = payloads.map(task);

		//var proms = payloads.map(network_utility.limiter.schedule(fitTry,req,r.body.id,{ limit : 50}));
		return await Promise.all(proms)
		//return r.body.id


	} catch (e) {
		console.error(e)
		throw(e)
	}
}


/**
 *
 * @param req.body.items array of artist strings
 * @param req.body.trackLimit number representing how many tracks from each artist
 * @param req.body.newPlaylistName output playlist name
 * @param res
 * @returns {Promise<void>}
 */
me.resolveArtistsToSamplePlaylist = async function (req, res) {
	let artistObs = [];

	req.body.items.forEach(artistString => {
		const aob = {type: "artist", name: artistString}
		artistObs.push(aob)
	})

	var searchAndProcessArtistItemTask = async function (item) {
		try {
			//ask spotify to search "type" results
			//we pass the entire item so we can track it item w/ result
			var response = await network_utility.limiter.schedule(spotify_api.searchSpotify, req, item)

			if (response?.result.items.length > 0) {
				//success: has "result"
				//matchArtistResult = {item: item, queryResultItems: queryResultItems, result:{}}
				//failure: has "flag"
				//matchArtistResult = {item: item, queryResultItems: queryResultItems, flag: "not on Spotify"}
				let processSearchSpotifyResult = async function (item, queryResultItems) {
					var matchArtistResult = false;

					//todo: should just be done globally on any item return
					//cleanup report back results
					queryResultItems.forEach(item => {
						item.available_markets = null
					});


					//don't bother to search Spotify for artists we know it doesn't have in the catalog
					if (notOnSpotify.indexOf(item.artist) !== -1) {
						matchArtistResult = {item: item, queryResultItems: queryResultItems, flag: "not on Spotify"}
						console.warn(matchArtistResult.flag, JSON.stringify(matchArtistResult, null, 4));
						return matchArtistResult
					} else {
						//==================================================
						//does item (track/album) have the artist we expect?

						//for each track/album item
						for (var x = 0; x < queryResultItems.length && !matchArtistResult; x++) {
							var qItem = queryResultItems[x];
							let matchResult = processFuzzy(item.name, qItem.name);
							if (matchResult) {
								// non-falsy matchResult breaks out of both loops
								matchArtistResult = {
									item: item,
									result: qItem,
									matchReason: matchResult.matchReason
								}
							}

						}//outer-for


						if (!matchArtistResult) {
							matchArtistResult = {
								item: item,
								queryResultItems: queryResultItems,
								flag: "failed to match query artist any result artist"
							}
							console.warn(matchArtistResult.flag, JSON.stringify(matchArtistResult, null, 4));
							return matchArtistResult

						} else {
							return {
								item: item, queryResultItems: queryResultItems, result:
									{matchArtistResult: matchArtistResult}
							}
						}//fail
					}//fail

				}//processSearchSpotifyResult

				return await processSearchSpotifyResult(response.item, response.result.items)
			} else {
				let result = {item: item, responseItems: response.result.items, flag: "searchSpotify returned nothing!"}
				return result;
			}
		} catch (e) {
			console.error(e);
			debugger
		}

	}
	//searchAndProcessArtistItemTask

	var psartists = artistObs.map(searchAndProcessArtistItemTask);

	var results = await Promise.all(psartists)

	let failures = results.filter(r => !r.result)
	let successes = results.filter(r => r.result)

	console.log(`successes: ${successes.length} | failures: ${failures.length}`)


	let str = ""
	failures.forEach(f => {
		str = str + f.item.artist.name + ","
	})

	//note: just taking the top result
	let fullyQualifiedArtists = []
	successes.forEach(taskResult => {
		fullyQualifiedArtists.push(taskResult.result.matchArtistResult.result)
	})

	var getArtistTopTracksTask = async function (item) {
		try {
			//ask spotify to search "type" results
			//we pass the entire item so we can track it item w/ result
			return network_utility.limiter.schedule(getArtistTopTracks, req, item, 5)
		} catch (e) {
			console.error(e);
			debugger
		}

	}

	//only fetch tracks for good results
	let tracks = []
	var pstracks = fullyQualifiedArtists.map(getArtistTopTracksTask);
	var trackResultSets = await Promise.all(pstracks)

	//unwind array of arrays, and cut down number of songs from each artist to req.body.tracksLimit
	let fullyQualifiedTracks = [];
	trackResultSets.forEach(set => {
		set = set.slice(0, req.body.tracksLimit)
		fullyQualifiedTracks = fullyQualifiedTracks.concat(set)
	})


	await makeAndPopulatePlaylist(req, req.body.newPlaylistName, fullyQualifiedTracks)

}
//resolveArtistsToSamplePlaylist


me.resolveArtistsTracksTuplesToPlaylist = async function (req, res) {
	let tuples = require("../scripts/rolling-stones-top-100-guitarists-scraper/guitaristTrackTuples");
	//testing:
	//tuples = tuples.slice(0, 1)
	let trackArtistArr = [];
	tuples.forEach(t => {
		t.track_obs.forEach(tob => {
			tob.artist = t.artist;
			trackArtistArr.push(tob)
		})
	})

	var task = async function (item) {
		try {
			//todo: we passed this in a strange way, so that we can't calculate it here.
			// should redo above

			//ask spotify to search "type" results
			//we pass the entire item so we can track it item w/ result
			var response = await network_utility.limiter.schedule(spotify_api.searchSpotify, req, item)

			if (response?.result.items.length > 0) {
				//success: has "result"
				//matchArtistResult = {item: item, queryResultItems: queryResultItems, result:{}}
				//failure: has "flag"
				//matchArtistResult = {item: item, queryResultItems: queryResultItems, flag: "not on Spotify"}
				let processSearchSpotifyResult = async function (item, queryResultItems) {
					var matchArtistResult = false;

					//todo: should just be done globally on any item return
					//cleanup report back results
					queryResultItems.forEach(item => {
						item.available_markets = null
					});

					//don't bother to search Spotify for artists we know it doesn't have in the catalog
					if (notOnSpotify.indexOf(item.artist) !== -1) {
						matchArtistResult = {item: item, queryResultItems: queryResultItems, flag: "not on Spotify"}
						console.warn(matchArtistResult.flag, JSON.stringify(matchArtistResult, null, 4));
						return matchArtistResult
					} else {
						//==================================================
						//does item (track/album) have the artist we expect?

						//for each track/album item
						for (var x = 0; x < queryResultItems.length && !matchArtistResult; x++) {
							var qItem = queryResultItems[x];
							//does the item's artist match any result from the query?
							for (var y = 0; y < qItem.artists.length && !matchArtistResult; y++) {
								var qArtist = qItem.artists[y];

								let matchResult = processFuzzy(qArtist.name, item.artist.name);
								if (matchResult) {
									// non-falsy matchResult breaks out of both loops
									matchArtistResult = {
										item: item,
										result: qArtist.name,
										matchReason: matchResult.matchReason
									}
								}
							}
						}//outer-for

						if (!matchArtistResult) {
							matchArtistResult = {
								item: item,
								queryResultItems: queryResultItems,
								flag: "failed to match query artist any result artist"
							}
							console.warn(matchArtistResult.flag, JSON.stringify(matchArtistResult, null, 4));
							return matchArtistResult

						} else {
							//console.log(matchArtistResult.matchReason, JSON.stringify(matchArtistResult, null, 4));

							//==================================================
							////does the track/album title match one from the query results?

							let matchTrackResult = false;
							for (var x = 0; x < queryResultItems.length && !matchTrackResult; x++) {
								var qItem = queryResultItems[x];

								let matchResult = processFuzzy(qItem.name, item.name);
								if (matchResult) {
									// non-falsy matchResult breaks out of both loops
									matchTrackResult = {item: item, result: qItem, matchReason: matchResult.matchReason}
								}
							}//outer-for

							if (!matchTrackResult) {
								matchTrackResult = {
									item: item,
									queryResultItems: queryResultItems,
									flag: "failed to match query track with any result track"
								}
								console.warn(matchTrackResult.flag, JSON.stringify(matchTrackResult, null, 4));
								return matchTrackResult
							} else {
								return {
									item: item, queryResultItems: queryResultItems, result:
										{matchArtistResult: matchArtistResult, matchTrackResult: matchTrackResult}
								}
							}
						}//fail
					}//fail

				}//processSearchSpotifyResult

				return await processSearchSpotifyResult(response.item, response.result.items)
			} else {
				let result = {item: item, responseItems: response.result.items, flag: "searchSpotify returned nothing!"}
				return result;
			}
		} catch (e) {
			console.error(e);
			debugger
		}

	}//task

	var ps = trackArtistArr.map(task);

	var results = await Promise.all(ps)
	let failures = results.filter(r => !r.result)
	let successes = results.filter(r => r.result)

	console.log(`successes: ${successes.length} | failures: ${failures.length}`)
	let str = ""
	failures.forEach(f => {
		str = str + f.item.artist.name + ","
	})

	//only fetch tracks for good results
	let tracks = []
	successes.forEach(r => {
		tracks.push({id: r.result.matchTrackResult.result.id})
	})
	await makeAndPopulatePlaylist(req, "RollingStonesTop100Guitarists", tracks)
	debugger
}
//resolveArtistsTracksTuplesToPlaylist

me.resolveAlbumStringsToSamplePlaylist = async function (req, res) {

	//testing:
	//albums = albums.slice(0,150)
	//albums = albums.slice(0,1)
	//albums = albums.filter(a =>{return a.name === "1999"})

	var notOnSpotify = ["Joni Mitchell", "Neil Young"]
	try {
		var task = async function (item) {
			try {

				var response = await network_utility.limiter.schedule(spotify_api.searchSpotify, req, item)

				if (response?.result?.albums.items.length > 0) {

					var processFuzzy = function (item, artist) {

						var a = FuzzySet();

						a.add(item.artist);
						var missing = a.get(artist.name) === null;
						var get = false;
						//for some reason fuzzy is missing stuff like "Prince" "Prince and the Revolution"???
						var contains = artist.name.indexOf(item.artist) !== -1 || item.artist.indexOf(artist.name) !== -1

						// !missing ? get =  a.get(artist.name)[0][0]:{}
						!missing ? get = a.get(artist.name) : {}
						if (!contains && (missing || get < .5)) {
							//rejectedMatches.push([item.name, artist.name])
							//debugger
							return false;
						} else {
							return true;
						}
					}

					var matchResult = false;
					for (var x = 0; x < response.result.albums.items.length; x++) {
						var album = response.result.albums.items[x]
						if (processFuzzy(item, {name: album.artists[0].name})) {
							matchResult = {item: item, result: album.artists[0].name}
						}
					}
					if (notOnSpotify.indexOf(item.artist) !== -1) {
						matchResult = {item: item, result: response.result.albums.items, flag: "not on Spotify"}
						return matchResult
					} else if (!matchResult) {
						response.result.albums.items.forEach(item => {
							item.available_markets = null;
						});
						matchResult = {item: item, result: response.result.albums.items, flag: "failed"}
						// console.log("bad album artist match: " +  response.result.albums.items[0].artists[0].name + " | " +item.artist);
						console.log("bad album artist match: ", JSON.stringify(matchResult, null, 4));

						return matchResult
					} else {
						var trackOb = await network_utility.limiter.schedule(spotify_api.resolveAlbumTracks, req, response.result.albums.items[0].id)

						// console.log("id",response.result.albums.items[0].artists[0].id);
						var _getArtist = async function (artistId) {
							try {
								return await req.body.spotifyApi.getArtist(artistId);
							} catch (e) {
								debugger;
								throw e
							}
						}

						var artistOb = await network_utility.limiter.schedule(_getArtist, response.result.albums.items[0].artists[0].id)
						//console.log("artistOb",artistOb);

						return {
							query: item,
							tracks: trackOb[0].slice(0, 2),
							artist: artistOb.body,
							album: response.result.albums.items[0]
						}
					}

				} else {
					return response;
				}

			} catch (e) {
				debugger
			}
		}

		//testing:
		//albums = albums.slice(0,10)
		//albums = albums.slice(0,1)


		var ps = albums.map(task);

		//var ps = []
		// ps.push(network_utility.limiter.schedule(spotify_api.searchSpotify,req,albums[0]))
		//ps.push(spotify_api.searchSpotify(req,albums[0]))

		//testing:

		var results = await Promise.all(ps)

		//todo:move up
		const IM = require('../utility/inMemory')

		var _ = require('lodash')

		function familyFreq(a) {

			var ret = null;

			//a = JSON.parse(JSON.stringify(a));
			//console.log(JSON.parse(JSON.stringify(a)));
			// console.log("familyFreq",a.genres);
			// console.log("familyFreq",a.genres.length >0);

			if (a.genres && a.genres.length > 0) {
				var fmap = {};
				for (var z = 0; z < a.genres.length; z++) {
					if (a.genres[z].family_name) {
						if (!(fmap[a.genres[z].family_name])) {
							fmap[a.genres[z].family_name] = 1
						} else {
							fmap[a.genres[z].family_name]++;
						}
					}
				}

				//console.log("$fmap",fmap);

				//check the family map defined and see who has the highest score
				if (!(_.isEmpty(fmap))) {
					//convert map to array (uses entries and ES6 'computed property names')
					//and find the max
					var arr = [];
					Object.entries(fmap).forEach(tup => {
						var r = {[tup[0]]: tup[1]};
						arr.push(r);
					});
					//todo: could offer this
					var m = _.maxBy(arr, function (r) {
						return Object.values(r)[0]
					});
					var f = Object.keys(m)[0];
					//console.log("%", f);
					ret = f;
				}
			} else {
				//if
				console.warn("no genres!", a.name);
			}
			ret ? a.familyAgg = ret : {};
			return ret;
		}

		var results_pre = results.length + ""
		var failed = results.filter(r => {
			return r.flag
		})
		results = results.filter(r => {
			return !r.flag
		})
		//todo:
		var unknown = results.filter(r => {
			return r.failure
		})
		results = results.filter(r => {
			return !r.failure
		})

		console.log("bad requests", failed)
		console.log("bad requests ratio", failed.length + "/" + results_pre);
		console.log("unknown requests", unknown)
		debugger

		results.forEach(r => {
			if (!r.artist.genres) {
				debugger
			}
			r.artist.genres = r.artist.genres.map(gString => {
				return IM.genresQualifiedMap[gString]
			})
			r.artist.genres = r.artist.genres.filter(g => {
				return g !== undefined
			})
			r.artist.familyAgg = familyFreq(r.artist)

		})

		function capitalizeFirstLetter(string) {
			return string.charAt(0).toUpperCase() + string.slice(1);
		}

		const sortedResultsFamily = results.reduce((groups, album) => {
			//const splitString = email.split('@');
			//const account = splitString[0];
			const domain = album.artist.familyAgg


			if (!groups[domain]) groups[domain] = [];

			groups[domain].push(album);
			return groups;
		}, {});

		var myRegexpYear = /(.*)-(.*)-(.*)/g;
		var myRegexpMonth = /(.*)-(.*)/g;

		const getDecade = (album) => {
			var m = null;
			if (album.release_date_precision === 'year') {
				m = album.release_date
			} else if (album.release_date_precision === 'month') {
				m = new RegExp(myRegexpMonth).exec(album.release_date)[1]
			} else {
				m = new RegExp(myRegexpYear).exec(album.release_date)[1]

			}
			// if(m === null){
			// 	debugger
			// }

			m = parseInt(m)
			switch (true) {
				case m < 1970:
					return 60
				case m >= 1970 && m < 1980:
					return 70
				case m >= 1980 && m < 1990:
					return 80
				case m >= 1990 && m < 2000:
					return 90
				case m >= 2000 && m < 2030:
					return 2030
				default:
					console.error('no date!', m)
					debugger
				// code block
			}
		}

		const sortedResultsDecade = results.reduce((groups, ob) => {
			//const splitString = email.split('@');
			//const account = splitString[0];
			const domain = getDecade(ob.album)


			if (!groups[domain]) groups[domain] = [];

			groups[domain].push(ob);
			return groups;
		}, {});

		var newPlaylistIds = [];
		const makePopPlaylist = async function (domain, songs) {
			domain = capitalizeFirstLetter(domain)
			try {
				var pname = 'RollingStonesTop500' + (domain ? '-' + domain : "")
				var desc = {'description': 'My description', 'public': true};

				var _createPlaylist = async function (id, pname, desc) {
					try {
						var res = await req.body.spotifyApi.createPlaylist(id, pname, desc);
						return res
					} catch (e) {
						throw e
					}
				}

				var r = await network_utility.limiter.schedule(_createPlaylist, req.body.user.id, pname, desc);
				console.log("new playlist", r.body.id)

				newPlaylistIds = newPlaylistIds.concat(r.body.id)
				var _addTracksToPlaylist = async function (id, payload) {
					try {
						var res = await req.body.spotifyApi.addTracksToPlaylist(id, payload);
						return res
					} catch (e) {
						throw e
					}
				}
				var fitTry = async function (req, id, payload) {
					try {
						//payload = payload.slice(0,5)
						var res = await network_utility.limiter.schedule(_addTracksToPlaylist, id, payload)
						//debugger
						return res
					} catch (e) {
						//debugger
						throw e
					}
				}
				var task = async function (payload) {
					try {
						var response = await fitTry(req, r.body.id, payload)
						//debugger
						return response;
					} catch (e) {
						//debugger
						throw e
					}
				}

				var payloads = giveMePayloads(songs, 100)
				var proms = payloads.map(task);

				//var proms = payloads.map(network_utility.limiter.schedule(fitTry,req,r.body.id,{ limit : 50}));
				return await Promise.all(proms)
				//return r.body.id


			} catch (e) {
				console.error(e)
				throw(e)
			}
		}

		//note: use sorted or not
		//var sorted = false
		//var sorted = sortedResultsDecade
		var sorted = sortedResultsFamily

		if (sorted) {

			Object.keys(sorted).forEach(domain => {
				var songs = [];
				sorted[domain].forEach(r => {
					songs = songs.concat(r.tracks)
				})
				console.log("domain:" + domain, songs.length);

				var fucked = songs.filter(s => {
					return s === undefined
				})
				console.log("fucked", fucked.length);
				//debugger
				songs = songs.filter(s => {
					return s !== undefined
				})
				songs = songs.map(s => "spotify:track:" + s.id);

				network_utility.limiter.schedule(makePopPlaylist, domain, songs)
					.then(r => {
						//todo: check add results
						console.log("new playlist ids", newPlaylistIds)
						console.log("finished!");
					}, e => {
						console.error(e);
						debugger
					})

			})

		} else {
			//note: use unsorted (single domain = blank)
			var songs = [];
			results.forEach(r => {
				songs = songs.concat(r.tracks)
			})
			console.log("songs", songs.length);

			var fucked = songs.filter(s => {
				return s === undefined
			})
			console.log("fucked", fucked.length);

			songs = songs.filter(s => {
				return s !== undefined
			})
			songs = songs.map(s => "spotify:track:" + s.id);

			var r = await makePopPlaylist("", songs)
			//todo: check add results
			console.log("new playlist ids", newPlaylistIds)
			console.log("finished!");

		}

		//var atres = await network_utility.limiter.schedule(fitTry,req,r.body.id,{ limit : 50})
		// req.body.spotifyApi.addTracksToPlaylist(r.body.id, payload)
		// 	.then(function (data) {
		// 		console.log('Added tracks to playlist!');
		// 	}, function (err) {
		// 		console.log('Something went wrong!', err);
		// 	});


	} catch (e) {
		debugger
	}

}

me.removeThesePlaylists = async function (req, res) {
//todo: print out ids with "" to paste into postman
	//https://open.spotify.com/playlist/14NAawPbmb1qvzQmm2CUXa?si=b5527cfb4312453f
	var playlists = [
		'4rjLF4mTuBTrvOwrsnwYUh',
		'4YmDseLsAAkEirdjbGCbd3',
		'4MOd5QLxCyhrw9hhCDKaFH',
		'1w6Trz68YVLEF2Z20VjsEt',
		'47NMjDTxlLzcGrBO5IP2hT',
		'5LglRHvThqysvL9eWKcP5F',
		'14NAawPbmb1qvzQmm2CUXa'
	]

	var _unfollowPlaylist = async function (req, pId) {
		try {
			return res = await req.body.spotifyApi.unfollowPlaylist(pId)
		} catch (e) {
			throw e
		}
	}

	var proms = [];
	playlists.forEach(pId => {
		proms.push(network_utility.limiter.schedule(_unfollowPlaylist, req, pId))
	})
	Promise.all(proms).then(r => {
		debugger
	}, e => {
		debugger
	})
}


const filterEvents = function (req, jsonInputFile) {

	//testing: filter for only events before date
	//todo: (should be done when we pull these)

	if (req.body.dateFilter.start) {

		let filterStartDate = new Date(req.body.dateFilter.start)
		console.log("filterStartDate", req.body.dateFilter.start)
		//note: ignoring event start time, since I don't accept the time of day as a filter parameter
		//so I guess it's okay that I don't create the compare dateA with it (e.start.time)
		//instead, since my filterDates are 0:00:00, I'll set the EVENT time to 1 second after that

		jsonInputFile = jsonInputFile.filter(e => {
			//if the show date comes after (is greater than) the stopDate
			const dateA = new Date(e.start.date);
			dateA.setHours(0, 0, 1, 0);
			let cr = dateA > filterStartDate;
			return cr;

		})
	}

	if (req.body.dateFilter.stop) {
		// note: similarly, I set the the FILTER time to 1 second after the date
		let filterStopDate = new Date(req.body.dateFilter.stop)
		console.log("filterStopDate", req.body.dateFilter.stop)

		filterStopDate.setHours(0, 0, 1, 0);

		jsonInputFile = jsonInputFile.filter(e => {
			//if the show date comes before (is less than) the stopDate
			const dateA = new Date(e.start.date);
			let cr = dateA < filterStopDate;
			return cr;
		})
	}


	// //testing: sort by date
	// //todo: (should be done when we pull these)
	// jsonInputFile.sort((a, b) => {
	// 	const dateA = new Date(a.start.date);
	// 	const dateB = new Date(b.start.date);
	//
	// 	return dateA - dateB;
	// });

	//testing: filter for certain metros
	// //todo: (should be done when we pull these)
	// let columbus_metro_names =
	// 	[
	// 		"Columbus",
	// 		"Newark",
	// 		"Loudonville",
	// 		"Westerville",
	// 		"Circleville",
	// 		"Chillicothe",
	// 		"Athens",
	// 		"Mt. Vernon"
	// 	]
	// let all_metros = [];
	//
	// jsonInputFile = jsonInputFile.filter(e =>{
	//
	// 	let name = e.venue.metroArea.displayName;
	//
	// 	//note: sourced manual list
	// 	//if(all_metros.indexOf(name) == -1){all_metros.push(name)}
	//
	// 	if(columbus_metro_names.indexOf(name) !== -1){
	// 		return e.venue.metroArea.displayName === "Columbus"
	// 	}
	// 	else{
	// 		return false
	// 	}
	// })

	return jsonInputFile
};


//note: also populates req.body.artists in-place

const getArtistDateMap = function(req,jsonInputFile){
	//console.log({jsonInputFile})


	//todo: in cases where I couldn't resolve the artist, it looks like resolveEvents is returning
	//performance.artist w/ the songkick numeric id (and no spotify id/genres)

	//note: filter out erraonoes ongkick numeric id
	//note: make a map of each artist to their date so I can add them to playlists in chrono order later


	let LA_artist_date_map = {}

	//todo: not doing shit with either of these besides not including it in LA_artist_date_map
	let dups = [];
	let unresolvedEventArtists = [];

	jsonInputFile.forEach(e => {
		e.performance.forEach(p => {

			//no latin please (LA)
			var isLatin = p.artist.familyAgg === "latin";
			if (typeof p.artist.id === "string" && !isLatin) {
				req.body.artists.push(p.artist.id)
				if (!LA_artist_date_map[p.artist.id]) {
					LA_artist_date_map[p.artist.id] = e.start.date
				} else {
					dups.push(p.artist)
				}
			} else {
				unresolvedEventArtists.push(p.artist)
			}
		})
	});

	console.log("unresolvedEventArtists", JSON.stringify(uniqBy(unresolvedEventArtists.map(a => {
		return a.displayName
	}), "id")))

	return LA_artist_date_map

}

// var LA_resolveEvents = require("../scripts/songkick-scraper/LA_resolveEvents")

// let playlistName = "songkick-santa-fe.20231206"
//let jsonInputFilePath = "../scripts/songkick-scraper/octoparse-results/songkick-santa-fe.20231206.output.resolved.json"

let playlistName = "Songkick-SaltLakeCity.20241027.20250101"
//let jsonInputFilePath = "../scripts/songkick-scraper/octoparse-results/songkick-columbus.20240721.output.resolved.json"
let jsonInputFilePath = "../scripts/songkick-scraper/octoparse-results/Songkick-SaltLakeCity.20241027.output.resolved.json"

/**
 * @desc given an input json file w/ fully qualified songkick events:
 * 	- (optional) apply date filtering if defined in req body
 * 	- ask spotify for ${tracksLimit} # of tracks from each artist
 * 	- (optional) choose alternative output playlist format
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
me.createPlaylistFromJson = async function (req, res) {
	var jsonInputFile = require(jsonInputFilePath)

	//testing: reduce input size
	//jsonInputFile = jsonInputFile.slice(0,2)

	console.log("createPlaylistFromJson | path", jsonInputFilePath);
	let jsonInputFileStartLength = JSON.parse(JSON.stringify(jsonInputFile)).length
	req.body.tracksLimit = 2;
	req.body.artists = [];
	//req.body.dateFilter.start = "03-12-2024"
	//req.body.dateFilter.stop =  "04-16-2024"

	//omitting eachFamily and eachDay just creates 1 playlist
	req.body.eachFamily = false;
	//todo: untested
	req.body.eachDay = false;

	req.body.userArtistsFilter = true;

	jsonInputFile = filterEvents(req, jsonInputFile)
	console.log("pre-filtered from inputjson", jsonInputFile.length + " / " + jsonInputFileStartLength)


	//todo: in cases where I couldn't resolve the artist, it looks like resolveEvents is returning
	//performance.artist w/ the songkick numeric id (and no spotify id/genres)

	//note: filter out erraonoes ongkick numeric id
	//note: make a map of each artist to their date so I can add them to playlists in chrono order later

	let LA_artist_date_map = {}

	//todo: not doing shit with either of these besides not including it in LA_artist_date_map
	let dups = [];
	let unresolvedEventArtists = [];

	jsonInputFile.forEach(e => {
		e.performance.forEach(p => {

			//no latin please (LA)
			var isLatin = p.artist.familyAgg === "latin";
			if (typeof p.artist.id === "string" && !isLatin) {
				req.body.artists.push(p.artist.id)
				if (!LA_artist_date_map[p.artist.id]) {
					LA_artist_date_map[p.artist.id] = e.start.date
				} else {
					dups.push(p.artist)
				}
			} else {
				unresolvedEventArtists.push(p.artist)
			}
		})
	});

	//avoid duplicate calls to get tracks for this artist later on
	req.body.artists = uniq(req.body.artists);

	console.log("req.body.artists",JSON.parse(JSON.stringify(req.body.artists.length)))

	//testing:
	let artistsFiltered =[];
	if(req.body.userArtistsFilter){
		//todo: mixing types here (full artist v. artist id)
		let r = await spotify_api._getFollowedArtists(req);
		let userSavedTracksArtists = await spotify_api._getMySavedTracksArtists(req);
		//console.log("_getFollowedArtists",r.artists.length)
		//console.log("userSavedTracksArtists",userSavedTracksArtists.length)
		let artistsConcat = r.artists.concat(userSavedTracksArtists)
		let artists = uniqBy(artistsConcat, "id")
		console.log("_getFollowedArtists + _getMySavedTracksArtists length",artistsConcat.length)
		req.body.artists.forEach(aId =>{
			let found = artists.find(aFind => {
				return aId ===aFind.id
			})
			if(found){
				artistsFiltered.push(aId)
			}
		})
	}
	console.log("artistsFiltered",artistsFiltered.length)
	req.body.artists = artistsFiltered;

	console.log("unresolvedEventArtists", JSON.stringify(uniqBy(unresolvedEventArtists.map(a => {
		return a.displayName
	}), "id")))

	//testing:
	//req.body.artists = req.body.artists.slice(0,51)

	try {
		var task_getArtistTopTracks = async function (id) {
			//note: id stays the same like this??
			// delete req.body.artist
			// req.body.artist= {id:id}
			//var _req = {body:{spotifyApi:req.body.spotifyApi,artist:{id:id}}}

			try {

				//testing:
				//example artist id: 43ZHCT0cAZBISjO8DG9PnE
				//id = "43ZHCT0cAZBISjO8DG9PnE";
				//var response = await limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')

				//note: straight-spotifyApi
				// var response = await network_utility.limiter.schedule({id:`_getArtistTopTracks: ${id}`}
				var response = await network_utility.limiter.schedule(_getArtistTopTracks, req, id)
				return response;
			} catch (e) {
				debugger
			}
		}

		var proms = req.body.artists.map(task_getArtistTopTracks);
		var songSets = await Promise.all(proms)


		var songs = [];

		songSets.forEach(s => {
			songs = songs.concat(s.slice(0, req.body.tracksLimit))
		})


		//note: create map of dates to arrays to hold artist ids

		var daySongPays = {};
		Object.values(LA_artist_date_map).forEach(d => {
			daySongPays[d] = [];
		})

		songs.forEach(s => {
			//what was the date for this artist of this song?
			//note: take care of possible extra artists besides event one in song
			s.artists = s.artists.filter(a => {
				return LA_artist_date_map[a.id]
			})
			let date = LA_artist_date_map[s.artists[0].id];
			//push the song into an array based on that date
			// if(dayPays[date].indexOf(s.artists[0].id) === -1){
			// 	dayPays[date].push(s.artists[0].id)
			// }

			//todo: need to compare by id not object
			//var r = _.find(daySongPays[date],function(r){return r.id===s.id});

			if (daySongPays[date].indexOf(s) === -1) {
				daySongPays[date].push(s)
			}
		})

		function createPlaylistForEachDay() {
			var promises = []
			Object.keys(daySongPays).forEach(d => {
				promises.push(limiter.schedule(spotify_api.createPlaylist, req, req.body.user, {name: playlistName}, daySongPays[d]))
			})
			return promises
		}

		var _addTracksToPlaylist = async function (id, payload) {
			try {
				payload = payload.map(s => "spotify:track:" + s.id);
				var res = await req.body.spotifyApi.addTracksToPlaylist(id, payload);
				return res
			} catch (e) {
				throw e
			}
		}

		function addToPlaylistForEachDay(id, daySongPays) {

			//var promises = []
			let payloads = []

			for (var x = 1; x < Object.keys(daySongPays).length; x++) {
				let payload_date = Object.keys(daySongPays)[x];

				//todo: result of testin
				if (daySongPays[payload_date].length > 0) {
					//promises.push(limiter.schedule(_addTracksToPlaylist, id,daySongPays[payload_date]));
					payloads.push(daySongPays[payload_date])
				}
			}
			return payloads
		}

		var task_addTracksToPlaylist = async function (pay) {

			try {
				var response = await network_utility.limiter.schedule(_addTracksToPlaylist, r_create_playlist_id, pay)
				return response;
			} catch (e) {
				debugger
			}
		}

		//todo: forgot how to pass things other than pay, so recorded this below before execution
		let r_create_playlist_id = null;

		if (req.body.eachDay) {
			var r = await Promise.all(createPlaylistForEachDay());
			//todo:
		} else if (req.body.eachFamily) {

			let trackFamilyMap = await me.sortTracksToFamilies(req, songs)

			let promises = []
			Object.keys(trackFamilyMap).forEach(family => {
				promises.push(network_utility.limiter.schedule(makeAndPopulatePlaylist, req, playlistName + "_" + family, trackFamilyMap[family]))
			})

			await Promise.all(promises)
			debugger
		} else {
			//create playist with 1 payload

			let payload_0_date = Object.keys(daySongPays)[0];
			let payload_0 = daySongPays[payload_0_date];

			//testing: wtf is this bullshit
			//var r_create = {playlist:{id:"6JGQhQSYtM2FN5DHs3kYzE"}}
			var r_create = await network_utility.limiter.schedule(spotify_api.createPlaylist, req, req.body.user, {name: playlistName}, payload_0)

			console.log("new playlist id:", r_create.playlist.id)
			//var r_add =  await limiter.schedule(addToPlaylistForEachDay,r_create.playlist.id,daySongPays)
			let payloads = addToPlaylistForEachDay(r_create.playlist.id, daySongPays)
			r_create_playlist_id = r_create.playlist.id;

			var add_proms = payloads.map(task_addTracksToPlaylist);
			var mresults = await Promise.all(add_proms)
		}
		//note: when tracksR submits the playlist, it tacks on myCreated/myUpdated
		var tracksR = await db_mongo_api.trackUserPlaylist(req.body.user, r_create.playlist)
		res.send(tracksR)
	} catch (e) {
		debugger
		console.error(e)
		res.status(500).send(e)
	}
};

me.prunePlaylistFromJson = async function (req, res) {

	try {
		var jsonInputFile = require(jsonInputFilePath)
		console.log("prunePlaylistFromJson | path", jsonInputFilePath);

		//testing:
		let playlistId = "62cAeGlbK8vt6IzWqF4BYP";
		console.log("prunePlaylistFromJson | playlistId", playlistId);

		req.body.tracksLimit = 2
		req.body.artists = [];

		let jsonInputFileStartLength = JSON.parse(JSON.stringify(jsonInputFile)).length
		var eventsToRemove = filterEvents(req, jsonInputFile)

		let removalReport = {
			num_events_removed:eventsToRemove.length,
			first_event:eventsToRemove[0].displayName,
			first_event_artists:eventsToRemove[0].performance.map(p =>{return p.displayName}),
			last_event:eventsToRemove[eventsToRemove.length -1].displayName,
			last_event_artists:eventsToRemove[eventsToRemove.length -1].performance.map(p =>{return p.displayName}),

		}
		console.log("pre-filtered to remove from inputjson", removalReport.num_events_removed + " / " + jsonInputFileStartLength)
		console.log("first event:",removalReport.first_event)
		console.log("first event artists:",removalReport.first_event_artists)
		console.log("last event:",removalReport.last_event)
		console.log("last event artists:",removalReport.last_event_artists)


		let artistDateMap = getArtistDateMap(req,eventsToRemove)

		//testing:
		//req.body.artists = req.body.artists.slice(0,10)

		//for every performance who's date is passed, we need to identify which songs we need to remove by that artist
		//fetch tracks from playlist in order
		//n*n for every performance find the first track(s) by that artist
		//remove tracks from array
		//clear playlist
		//add new filtered back in order

		//testing:
		//console.log(JSON.stringify(jsonInputFile[0],null,4))

		//fetch this so we can use snapshot_id later
		let playlist = await playlist_api.getPlaylist(req, playlistId)

		let currentTracks = await playlist_api.getPlaylistTracks(req, playlistId)
		let track_removal_index_map = {};
		currentTracks.forEach((tob, i) => {

			//todo: is there some unintended consequences from just removing every song by one of the (example 3)
			//artists on a single track? what if I successfully put tracks on for 3 artists, but one of the tracks
			//I put on ALSO includes another one of the 3 artists? I guess it just removes earlier than would have been detected?

			//todo: feel like this needs to be sensitive to position
			//if we see removal of indexes that aren't contiguoluous, that's a clue we're removing artist from somewhere we shouldn't?

			//for every artist on the track, if they're on our map, remove that song
			tob.track.artists.forEach(a => {
				//if we have it in our map, we need to remove the first entry
				if (artistDateMap[a.id]) {
					track_removal_index_map[i] = a
				}
			})
		})

		let indexes = Object.keys(track_removal_index_map).map(str => parseInt(str))

		removalReport.num_tracks_removed = indexes.length;
		removalReport.num_tracks_before = currentTracks.length;
		removalReport.num_tracks_after = currentTracks.length - indexes.length
		removalReport.first_track_index = indexes[0];
		removalReport.last_track_index = indexes[indexes.length -1];

		console.log("num_tracks_removed",removalReport.num_tracks_removed)

		debugger
		if(indexes.length > 0){
			let r_removal = await req.body.spotifyApi.removeTracksFromPlaylistByPosition(playlist.id,
				indexes, playlist.snapshot_id)
		}

		res.send(removalReport)

	} catch (e) {
		console.error(e)
		debugger
		res.status(500).send(e)
	}

	// try {
	// 	var task = async function (index) {
	// 		try {
	// 			//note: straight-spotifyApi
	// 			var response = await network_utility.limiter.schedule(_getArtistTopTracks, req, id)
	// 			return response;
	// 		}
	// 		catch (e) {
	// 			debugger
	// 		}
	// 	}
	//
	//
	// 	var proms = req.body.artists.map(task);
	// 	var songSets = await Promise.all(proms)
	//
	// 	var songs = [];
	//
	// 	songSets.forEach(s => {
	// 		songs = songs.concat(s.slice(0, req.body.tracksLimit))
	// 	})
	//
	// 	//testing: create playlist for each day
	//
	// 	//note: create map of dates to arrays to hold artist ids
	//
	// 	var daySongPays = {};
	// 	Object.values(LA_artist_date_map).forEach(d => {
	// 		daySongPays[d] = [];
	// 	})
	//
	// 	songs.forEach(s => {
	// 		//what was the date for this artist of this song?
	// 		//note: take care of possible extra artists besides event one in song
	// 		s.artists = s.artists.filter(a => {
	// 			return LA_artist_date_map[a.id]
	// 		})
	// 		let date = LA_artist_date_map[s.artists[0].id];
	// 		//push the song into an array based on that date
	// 		// if(dayPays[date].indexOf(s.artists[0].id) === -1){
	// 		// 	dayPays[date].push(s.artists[0].id)
	// 		// }
	//
	// 		//todo: need to compare by id not object
	// 		//var r = _.find(daySongPays[date],function(r){return r.id===s.id});
	//
	// 		if (daySongPays[date].indexOf(s) === -1) {
	// 			daySongPays[date].push(s)
	// 		}
	// 	})
	//
	// 	//todo: untested
	// 	let eachDay = false;
	//
	// 	function createPlaylistForEachDay(){
	// 		var promises = []
	// 		Object.keys(daySongPays).forEach(d => {
	// 			promises.push(limiter.schedule(spotify_api.createPlaylist, req, req.body.user, {name: playlistName}, daySongPays[d]))
	// 		})
	// 		return promises
	// 	}
	//
	// 	var _addTracksToPlaylist = async function (id, payload) {
	// 		try {
	// 			payload = payload.map(s => "spotify:track:" + s.id);
	// 			var res = await req.body.spotifyApi.addTracksToPlaylist(id, payload);
	// 			return res
	// 		} catch (e) {
	// 			throw e
	// 		}
	// 	}
	//
	// 	function addToPlaylistForEachDay(id,daySongPays){
	//
	// 		//var promises = []
	// 		let payloads = []
	//
	// 		for(var x = 1; x < Object.keys(daySongPays).length;x++){
	// 			let payload_date = Object.keys(daySongPays)[x];
	//
	// 			//todo: result of testin
	// 			if(daySongPays[payload_date].length > 0){
	// 				//promises.push(limiter.schedule(_addTracksToPlaylist, id,daySongPays[payload_date]));
	// 				payloads.push(daySongPays[payload_date])
	// 			}
	// 		}
	// 		return payloads
	// 	}
	//
	// 	//todo: forgot how to pass things other than pay, so recorded this below before execution
	// 	let r_create_playlist_id = null;
	// 	var task = async function (pay) {
	//
	// 		try {
	// 			var response = await network_utility.limiter.schedule(_addTracksToPlaylist,r_create_playlist_id, pay)
	// 			return response;
	// 		} catch (e) {
	// 			debugger
	// 		}
	// 	}
	//
	// 	if(eachDay){
	// 		var r = await Promise.all(createPlaylistForEachDay());
	// 	}
	// 	else{
	// 		//create playist with 1 payload
	//
	// 		let payload_0_date = Object.keys(daySongPays)[0]
	// 		let payload_0 = daySongPays[payload_0_date]
	// 		var r_create =  await network_utility.limiter.schedule(spotify_api.createPlaylist,req,req.body.user,{name:playlistName},payload_0)
	//
	// 		console.log("new playlist id:", r_create.playlist.id)
	// 		//var r_add =  await limiter.schedule(addToPlaylistForEachDay,r_create.playlist.id,daySongPays)
	// 		let payloads = addToPlaylistForEachDay(r_create.playlist.id,daySongPays)
	// 		r_create_playlist_id = r_create.playlist.id;
	// 		var add_proms = payloads.map(task);
	// 		var mresults = await Promise.all(add_proms)
	// 	}
	// 	//note: when tracksR submits the playlist, it tacks on myCreated/myUpdated
	// 	var tracksR = await db_mongo_api.trackUserPlaylist(req.body.user, r_create.playlist)
	//
	// 	res.send(tracksR)
	// } catch (e) {
	// 	debugger
	// 	console.error(e)
	// 	res.status(500).send(e)
	// }
};

me.sortTracksToFamilies = async function (req, tracks) {

	await resolver.resolveTracksArray(req, tracks)

	function familyFreq(a) {

		var ret = null;

		//a = JSON.parse(JSON.stringify(a));
		//console.log(JSON.parse(JSON.stringify(a)));
		// console.log("familyFreq",a.genres);
		// console.log("familyFreq",a.genres.length >0);

		if (a.genres && a.genres.length > 0) {
			var fmap = {};
			for (var z = 0; z < a.genres.length; z++) {
				if (a.genres[z].family_name) {
					if (!(fmap[a.genres[z].family_name])) {
						fmap[a.genres[z].family_name] = 1
					} else {
						fmap[a.genres[z].family_name]++;
					}
				}
			}

			//console.log("$fmap",fmap);

			//check the family map defined and see who has the highest score
			if (!(_.isEmpty(fmap))) {
				//convert map to array (uses entries and ES6 'computed property names')
				//and find the max
				var arr = [];
				Object.entries(fmap).forEach(tup => {
					var r = {[tup[0]]: tup[1]};
					arr.push(r);
				});
				//todo: could offer this
				var m = _.maxBy(arr, function (r) {
					return Object.values(r)[0]
				});
				var f = Object.keys(m)[0];
				//console.log("%", f);
				ret = f;
			}
		} else {
			//if
			console.warn("no genres!", a.name);
		}
		ret ? a.familyAgg = ret : {};
		return ret;
	}

	tracks.forEach(track => {
		track.artists.forEach(artist => {
			if (!artist.genres) {
				debugger
			}
			artist.familyAgg = familyFreq(artist)
		})
	})

	return tracks.reduce((groups, track) => {
		//todo: just taking first artist
		const familyAgg = track.artists[0].familyAgg
		if (!groups[familyAgg]) groups[familyAgg] = [];
		groups[familyAgg].push(track);
		return groups;
	}, {});

	// unwind into tracks

	// Object.keys(sortedResultsFamily).forEach(familyAgg => {
	// 	var songs = [];
	// 	songs = songs.concat(sortedResultsFamily[familyAgg])
	// 	console.log("familyAgg:" + familyAgg, songs.length);
	// 	songs = songs.map(s => "spotify:track:" + s.id);
	//
	// })

}
/**smarter playlists*/

me.archiveLikedSongs = async function (req, res) {

	try {

		//note: magic string map!
		let playlists = {
			electro_house: {
				tracks: [],
				savedTracks: [],
				playlistId: "6KJf8W3QVFMqaHFSwNu8XU"
			},
			rock: {
				tracks: [],
				savedTracks: [],
				playlistId: "6m9n4ThTjHyO5KBM4SCsBk"
			}
		};

		//todo: make parameterized
		let targetPlaylistKey = "rock"

		//todo: change to use same getPlaylistTracks in playlist_api

		let getPlaylistTracksTargetPlaylistResult = await req.body.spotifyApi.getPlaylistTracks(playlists[targetPlaylistKey].playlistId)
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(pagedRes => {
				return pagedRes.items;
			})
		playlists[targetPlaylistKey].tracks = getPlaylistTracksTargetPlaylistResult

		await resolver.resolveTracks(req, {tracks: playlists[targetPlaylistKey].tracks})

		let getMySavedTracksPagedResult = await req.body.spotifyApi.getMySavedTracks({limit: 50})
			//testing: skip paging
			//.then(network_utility.pageIt.bind(null,req,null,"skip"))
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(pagedRes => {
				return pagedRes.items;
			})

		await resolver.resolveTracks(req, {tracks: getMySavedTracksPagedResult})

		let savedTracksFiltered = [];

		//for every tracks' artists' genre, if the genre has the target family name, push the track

		getMySavedTracksPagedResult.forEach(item => {

			//todo: only looking at first artist right now
			for (var x = 0; x < item.track.artists[0].genres.length; x++) {
				let _genre = item.track.artists[0].genres[x]

				//todo: parameterize

				// if(_genre.family_name === "electro house"){
				// 	playlists.electro_house.tracks.push(item.track)
				// 	break;

				if (_genre.family_name === targetPlaylistKey) {
					playlists[targetPlaylistKey].savedTracks.push(item)
					break;
				}
				if (_genre.family_name === null) {
					debugger
				}
			}
		})


		//todo: parameterize

		function findAndRemoveDuplicatesByProperty(arr1, arr2, property) {

			const uniqueItems = [];
			const duplicates = [];

			// Iterate over the first array
			arr1.forEach(item => {
				// const value = item[property];
				const value = _.get(item, property);

				// Check if the property value exists in the second array
				const existsInArr2 = arr2.some(arr2Item => {
						return _.get(arr2Item, property) === value
					}
				);

				if (!existsInArr2) {
					uniqueItems.push(item);
				} else {
					duplicates.push(item);
				}
			});

			// Filter the second array to include only unique items
			const uniqueArr2 = arr2.filter(arr2Item => {
				const value = _.get(arr2Item, property)
				const existsInDuplicates = duplicates.some(duplicate => {
					return _.get(duplicate, property) === value;
				})
				return !existsInDuplicates;
			});

			return {
				uniqueItems,
				duplicates,
				uniqueArr2
			};
		}


		//testing: example set
		//const arr1 = [ { id: 1, track: {name:'John'}}, { id: 2, track: {name:'Jane'}}, { id: 3, track: {name:'Mike'}} ];
		// const arr2 = [ { id: 1, track: {name:'John'}}, { id: 2, track: {name:'Jane'}}, { id: 4, track: {name:'Mary'}}, ];

		//testing: subset
		//let arr1 = playlists[targetPlaylistKey].tracks.slice(0,5)
		// let arr2 = playlists[targetPlaylistKey].savedTracks.slice(0,5)
		// const result = findAndRemoveDuplicatesByProperty(arr1,arr2,

		const result = findAndRemoveDuplicatesByProperty(playlists[targetPlaylistKey].tracks, playlists[targetPlaylistKey].savedTracks,
			'track.name');

		// console.log(result.uniqueItems);
		// console.log(result.duplicates);

		let newSavedTracksMatchingTargetPlaylist = result.uniqueArr2;
		console.log("newSavedTracksMatchingTargetPlaylist", newSavedTracksMatchingTargetPlaylist.length);

		if (newSavedTracksMatchingTargetPlaylist.length > 0) {
			let payloads = [];
			let payload = [];

			newSavedTracksMatchingTargetPlaylist.forEach((s, i) => {
				if (i === 0) {
					payload.push("spotify:track:" + s.track.id)
				} else {
					if (!(i % 50 === 0)) {
						payload.push("spotify:track:" + s.track.id)
					} else {
						payloads.push(payload);
						payload = [];
						payload.push("spotify:track:" + s.track.id)
					}
				}
			})
			payload.length ? payloads.push(payload) : {};

			var _addTracksToPlaylist = async function (req, playlistId, payload) {
				try {

					var res = await req.body.spotifyApi.addTracksToPlaylist(playlistId, payload)
					return res.body.tracks
				} catch (e) {

					throw e
				}
			}

			var task = async function (payload) {
				//note: id stays the same like this??
				// delete req.body.artist
				// req.body.artist= {id:id}
				//var _req = {body:{spotifyApi:req.body.spotifyApi,artist:{id:id}}}

				try {
					//note: straight-spotifyApi
					//var response = await network_utility.limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')

					//todo: somehow limiter is reporting /createArtistPlaylist as the url it's retrying - but that's not true?
					//todo: parameterize
					//var response = await network_utility.limiter.schedule(_addTracksToPlaylist, req, playlists.electro_house.playlistId, payload)
					debugger
					var response = await network_utility.limiter.schedule(_addTracksToPlaylist, req, playlists[targetPlaylistKey].playlistId, payload)
					return response;
				} catch (e) {
					debugger
				}
			}

			var proms = payloads.map(task);
			Promise.all(proms)
				// spotifyApi.addTracksToPlaylist(r.body.id,payload)
				.then(function (data) {
					let newTracksSum = {
						newTracksLength: newSavedTracksMatchingTargetPlaylist.length,
						newTracks: newSavedTracksMatchingTargetPlaylist
					}
					let playlistSum = {targetPlaylistKey: targetPlaylistKey, id: playlists[targetPlaylistKey].id}
					let result = Object.assign({result: "success"}, newTracksSum, playlistSum)
					console.log('Added tracks to playlist!', result);
					res.send(result);

				}, function (err) {
					console.log('Something went wrong!', err);
					debugger;
					//fail({error:err})
				});
		} else {
			let warning = {
				msg: "archiveLikedSongs didn't have any new songs to archive",
				playlist: {targetPlaylistKey: targetPlaylistKey, id: playlists[targetPlaylistKey].id}
			}
			console.warn(warning)
			res.send(res)
		}

	} catch (err) {
		console.log('archiveLikedSongs failed', err);
		debugger;
	}
}

me.archiveBillboardHot100Playlists = async function(req, res) {

	let playlists_res = await playlist_api._getUserPlaylists(req)
	let singles = playlists_res.items.filter(p =>{
		return p.name.indexOf("Top US Singles") !==-1
	})
	console.log("singles.length",singles.length)
	//testing: batches (1155)
	//req.body.playlists = singles.slice(0,2);
	req.body.playlists = singles.slice(0,50);
	//req.body.playlists = singles.slice(500,1155);
	let resolved_singles_playlists = await resolver.resolvePlaylists(req)
	resolved_singles_playlists.forEach(p =>{
		let path = 'C:\\Users\\Candy.DESKTOP-TMB4Q31\\WebstormProjects\\Showcase-POC\\utility\\static-utility-records\\top_us_singles_playlists\\';
		let sanitized_name = p.name.replaceAll(" ","_");
		sanitized_name =  sanitized_name.replaceAll(":","_");
		let fname = path + sanitized_name +'.json';
		console.log(fname)
		fs.writeFileSync( fname,
			//,function(){console.log("saved" + p.name)}
			JSON.stringify(p,null,4), 'utf8')
	})
	console.log("done!")
	// playlists.sort((a,b) =>{
	// 	const a = "Top US Singles: 2009-2013";
	// 	const b = "Top US Singles: 2007-2013";
	// 	const regex = /(\d{4})-(\d{4})/;
	// 	const match = a.match(regex);
	// 	const startYear_a = parseInt(match[1]);
	// 	const endYear_a = parseInt(match[2]);
	// 	const a_intlen = endYear_a - startYear_a
	// 	const match_b = b.match(regex);
	// 	const startYear_b = parseInt(match_b[1])
	// 	const endYear_b = parseInt(match_b[2]);
	// 	const b_intlen = endYear_b - startYear_b
	// })
}


