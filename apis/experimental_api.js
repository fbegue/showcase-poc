//note: setup ripper 1st
var albums = [];
//var albums = require('../scripts/ripYoutubePlaylist/ripper').albums;
var fif = require('../scripts/rolling-stones-top-500-albums-scraper/50').albums;
var hun = require('../scripts/rolling-stones-top-500-albums-scraper/100').albums;
var hun15 = require('../scripts/rolling-stones-top-500-albums-scraper/150').albums;
var hun2 = require('../scripts/rolling-stones-top-500-albums-scraper/200').albums;
var hun25 = require('../scripts/rolling-stones-top-500-albums-scraper/250').albums;
var hun3 = require('../scripts/rolling-stones-top-500-albums-scraper/300').albums;
var hun35 = require('../scripts/rolling-stones-top-500-albums-scraper/350').albums;
var hun4 = require('../scripts/rolling-stones-top-500-albums-scraper/400').albums;
var hun45 = require('../scripts/rolling-stones-top-500-albums-scraper/450').albums;
var hun5 = require('../scripts/rolling-stones-top-500-albums-scraper/500').albums;

albums = albums.concat(hun5).concat(hun45).concat(hun4).concat(hun35).concat(hun3).concat(hun25).concat(hun2).concat(hun15).concat(hun).concat(fif).reverse()


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
var _ = require('lodash')

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

let artistsWithGroups = require("../scripts/rolling-stones-top-100-guitarists-scraper/artists_with_groups.chatgpt")
let artistGroupsMap = {}
artistsWithGroups.forEach(tuple => {
	tuple.bands.forEach(b => {
		if (artistGroupsMap[b]) {
			artistGroupsMap[b].push(tuple.name)
		} else {
			artistGroupsMap[b] = [tuple.name]
		}
	})
})

artistGroupsMap["Fleetwood Mac"] = ["Lindsey Buckingham", "Stevie Nicks"]

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

me.resolveArtistsTracksTuplesToPlaylist = async function (req, res) {
	let notOnSpotify = [];
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
}//resolveArtistsTracksTuplesToPlaylist

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


me.resolveArtists = async function (req, res) {

	console.log("resolveArtists", items.length)

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

	//testing:
	//albums = albums.slice(0,150)
	//items = items.slice(0,1)

	//debugger
	//albums = albums.filter(a =>{return a.name === "1999"})

	var notOnSpotify = ["Joni Mitchell", "Neil Young"]
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

//smarter playlists

me.archiveLikedSongs = async function (req, res) {

	try {

		//note: magic string map!
		let playlists = {
			electro_house: {
				tracks: [],
				savedTracks:[],
				playlistId: "6KJf8W3QVFMqaHFSwNu8XU"
			},
			rock: {
				tracks: [],
				savedTracks:[],
				playlistId: "6m9n4ThTjHyO5KBM4SCsBk"
			}
		};

		//todo: make parameterized
		let targetPlaylistKey = "rock"

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

		await resolver.resolveTracks(req, {tracks:getMySavedTracksPagedResult})

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
					return  _.get(arr2Item, property) === value}
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
				const existsInDuplicates = duplicates.some(duplicate =>{
					return  _.get(duplicate, property) === value;
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

		const result = findAndRemoveDuplicatesByProperty(playlists[targetPlaylistKey].tracks,playlists[targetPlaylistKey].savedTracks,
			 'track.name');

		// console.log(result.uniqueItems);
		// console.log(result.duplicates);

		let newSavedTracksMatchingTargetPlaylist = result.uniqueArr2;
		console.log("newSavedTracksMatchingTargetPlaylist",newSavedTracksMatchingTargetPlaylist.length);

		if(newSavedTracksMatchingTargetPlaylist.length > 0){
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
					let newTracksSum = {newTracksLength:newSavedTracksMatchingTargetPlaylist.length,newTracks:newSavedTracksMatchingTargetPlaylist}
					let playlistSum = {targetPlaylistKey:targetPlaylistKey,id:playlists[targetPlaylistKey].id}
					let result = Object.assign({result:"success"},newTracksSum,playlistSum)
					console.log('Added tracks to playlist!',result);
					res.send(result);

				}, function (err) {
					console.log('Something went wrong!', err);
					debugger;
					//fail({error:err})
				});
		}else{
			let warning = {msg: "archiveLikedSongs didn't have any new songs to archive",
				playlist:{targetPlaylistKey:targetPlaylistKey,id:playlists[targetPlaylistKey].id}}
			console.warn(warning)
			res.send(res)
		}

	} catch (err) {
		console.log('archiveLikedSongs failed', err);
		debugger;
	}
}
