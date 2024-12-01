let sql = require('mssql');

//All requests to the library will be returned a promise and when resolved the response will be JSON.
var Bottleneck = require("bottleneck");

const fs = require('fs')
const Songkick = require('songkick-api-node');
//https://github.com/schnogz/songkick-api-node

const apikey = "pdBY8kzaJtEjFrcw"
const songkickApi = new Songkick(apikey);

const db_api = require('./db_api');
var db_mongo_api = require('./db_mongo_api')
var spotify_api = require('./spotify_api')

const limiter = require('../utility/network_utility').limiter
const fuzzyMatch = require("../utility/fuzzyMatch")

//just checking out raw artist search
var searchArtists = function () {
	//console.info("searchArtists");
	songkickApi.searchArtists({query: 'Queen'})
		.then((res) => {
			console.info(JSON.stringify(res[0], null, 4));

			if (res[0].identifier) {
				res[0].identifier.forEach(function (id) {
					console.info(id.mbid);
				})
			}
		})
}
//searchArtists();

var findWithAttr = function (array, attr, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return i;
		}
	}
	return -1;
};

var count_properties = function (object) {
	var count = 0;
	for (var prop in object) {
		if (object.hasOwnProperty(prop)) {
			count++
		}
	}
	return count;
};

var weekday = new Array(7);
weekday[0] = "Sun";
weekday[1] = "Mon";
weekday[2] = "Tues";
weekday[3] = "Wed";
weekday[4] = "Thurs";
weekday[5] = "Fri";
weekday[6] = "Sat";

var weekday_full = new Array(7);
weekday_full[0] = "Sunday";
weekday_full[1] = "Monday";
weekday_full[2] = "Tuesday";
weekday_full[3] = "Wednesday";
weekday_full[4] = "Thursday";
weekday_full[5] = "Friday";
weekday_full[6] = "Saturday";

/**
 * find metros from string query
 * @function find_metros
 **/
var find_metros = function () {
	var state_string = "OH"
	songkickApi.searchLocations({query: 'Toledo'})
		.then(function (results) {
			// console.info("returned: ", results.length);
			console.info("returned: ", JSON.stringify(results));

			var json_parsed = [];

			results.forEach(function (record) {

				if (record.city) {
					if (record.city.state.displayName == state_string) {
						json_parsed.push(record)
					}
				} else if (record.metroarea) {
					if (record.metroarea.state.displayName == state_string) {
						json_parsed.push(record)
					}
				}
			})

			console.info("len: ", json_parsed.length);

			var json = JSON.stringify(json_parsed, null, 4)

			fs.writeFile("output.json", json, function (err) {
				if (err) {
					return console.info(err);
				}

				console.info("The file was saved!");
			});

		})

}

//find_metros()

var metros = [
	{
		"displayName": "Columbus",
		"id": 9480
	},
	{
		"displayName": "Salt Lake City",
		"id": 13560
	},
	{
		"displayName": "SF Bay Area",
		"id": 26330
	},
	{
		"displayName": "Cleveland",
		"id": 14700
	},
	{
		"displayName": "Cincinnati",
		"id": 22040
	},
	{
		"displayName": "Dayton",
		"id": 3673
	}
];

var dateFilter = {};
dateFilter.start = '2018-07-12';
dateFilter.end = '2018-07-18';

/**
 * then get events upcoming for a single metro
 * @function get_metro_events
 **/
var fetch_metro_events = function (metro, dateFilter) {

	return new Promise(function (done, fail) {

		dateFilter.start = new Date(dateFilter.start);
		dateFilter.end = new Date(dateFilter.end);
		console.info(dateFilter.start);
		console.info(dateFilter.end);

		//used for stats in return object
		var event_count = 0;

		var get_events = function (metro) {
			return new Promise(function (done1, fail) {
				console.info("get_events");

				var all_results = [];
				var page_count = 0;

				/**
				 * recusively called until page_length invariant stops chain, hence its broken out here
				 * @function get
				 **/
				var get = function () {

					var params = {};
					params.page = page_count;
					params.per_page = 50;

					console.info("getting" + metro.displayName + " " + metro.id + " page {" + page_count + "}...");
					songkickApi.getLocationUpcomingEvents(metro.id, params)
						.then(function (events) {
							debugger
							//console.info(JSON.stringify(events, null,4));

							var filterInRange = function (event) {

								var res = true;
								var eDate = new Date(event.start.date)
								// console.info( dateFilter.start + " > "  + eDate +  " < "+ dateFilter.end);
								// console.info( eDate < dateFilter.start)
								// console.info( eDate > dateFilter.end);

								//if start invalid, set false and ignore end value
								//if end invalid, set false and ignore start value unless start is false, then take start

								if (dateFilter.start && dateFilter.end) {
									if (eDate < dateFilter.start) {
										res = false;
									}
									if (eDate > dateFilter.end || !res) {
										res = false;
									}

								} else if (dateFilter.start && !dateFilter.end) {
									if (eDate < dateFilter.start) {
										res = false;
									}

								} else if (!dateFilter.start && dateFilter.end) {
									if (eDate > dateFilter.end) {
										res = false;
									}
								}
								// console.info(":: " + res);
								// console.info(event.start.date);
								return res;
							};


							var inRange = [];
							var outRange = [];

							for (var x = 0; x < events.length; x++) {

								if (filterInRange(events[x])) {
									inRange.push(events[x])
								} else {
									outRange.push(events[x])
								}
							}

							var result = {}
							result.id = metro.id;
							result.displayName = metro.displayName;
							result.events = inRange;

							//only push non-zero events.length results
							if (result.events.length > 0) {
								all_results.push(result)
							}


							//all_results is in array of per-page result.events
							all_results.forEach(function (result) {
								event_count = event_count + result.events.length;
							});

							//console.info("--------------------------------");
							//console.info("outrange:",outRange.length);
							//console.info("new events:",result.events.length);
							//console.info("total events:",event_count);
							//console.info("paging invariant:",events.length);

							//if page length is < 50
							//OR if we're starting to get zero-inrange results back, but we have SOME (for dateFilter.start)

							if (events.length < 50 || (result.events.length === 0 && all_results.length !== 0)) {

								console.info("invariant tripped. stopping.");
								done1(all_results)
							} else {
								page_count++;
								get()
							}
						}, e => {
							console.error("get_events failure", e)
							debugger
						})
				};

				get()

			})
		}


		//todo: option to do multiple metros

		var promises = [];

		//metros.forEach(function(metro){
		//    promises.push(get_events(metro))
		//})


		promises.push(get_events(metro));

		//results is an object with three fields: metro id, displayName (of metro) and the future events in that metro
		Promise.all(promises).then(function (results) {

			//console.info(JSON.stringify(results,null,4));

			//todo: b/c I'm doing one metro?
			results = results[0];

			let events = [];
			let metro_id = results[0].id;
			let ids = {};

			results.forEach(function (result) {
				result.events.forEach(function (event) {

					//console.info(JSON.parse(JSON.stringify(event)));
					if (ids[event.id]) {

					} else {
						ids[event.id] = event.id;
						event.metro_id = metro_id;
						//if(event.id === 35513049){	console.info(event)}
						events.push(event);
					}

				})
			});


			/**
			 * populate performance_dates array for writing later to songkick_performances
			 * @function write_schedule
			 **/
			var write_schedule = function () {
				results.forEach(function (result) {

					//console.info("===============");
					//console.info(result);


					// if(result.displayName == "Columbus"){

					result.events.forEach(function (event) {


						//todo: handle festivals differently (event.type = 'Festival')
						//performance is an array of artists (headliner, support, etc)
						var performance = {};

						var date = new Date(event.start.date)
						var m = date.getUTCMonth() + 1
						//var d = date.getDate()
						var d = date.getUTCDate()
						var y = date.getFullYear()
						var day = date.getUTCDay()

						var newDate = weekday[day] + ", " + m + "-" + d + "-" + y
						//console.info(m + " " + d + " " + y );

						// console.info("######");
						// console.info(event.start.date);
						// console.info(date);
						// console.info(newDate);

						//perf.date = event.start.date;
						//performance.date = newDate;

						performance.venue = event.venue.displayName;
						performance.artists = [];
						performance.id = event.id;


						event.performance.forEach(function (perf) {
							performance.artists.push(perf.artist.displayName)

						});
						debugger

						//haven't created entry for date yet
						if (dates.indexOf(newDate) == -1) {
							dates.push(newDate);


							performance_dates[newDate] = [];
							performance_dates[newDate].push(performance);
						} else {
							performance_dates[newDate].push(performance);

							//todo: tried to eliminate duplicate performance_dates
							// if(performance_dates[newDate].indexOf(performance) == -1){
							// 	performance_dates[newDate].push(performance);
							// }
							// else{
							// 	console.info(performance);
							// }
						}

					})

					// }//displayName
				})
			}; //write schedule

			//write_schedule();

			console.info("----------------------");
			console.info("# of payloads: ", results.length);
			console.info("events length: ", events.length);
			console.info("----------------------");

			done(events);

			// var json = JSON.stringify(results,null,4)
			//
			//
			// fs.writeFile(raw, json, function(err) {
			//
			// 	if(err) {   return console.info(err); }
			// 	else{ console.info(raw + " saved!");}
			// });
			//
			// var output = {};
			// output.result = {};
			// output.result.area = metro.displayName;
			// output.result.events = event_count;
			// output.result.dates = performance_dates;
			//
			// json = JSON.stringify(output,null,4);
			//
			// fs.writeFile(areaDatesArtists, json, function(err) {
			//
			// 	if(err) {   return console.info(err); }
			// 	else{
			// 		console.info(areaDatesArtists + " saved!");
			// 		done2(results);
			// 	}
			//
			// });


		}).catch(function (e) {
			console.info(e);
		})

	})

}//getMetroEvents

//let inputJsonFile = require("../scripts/songkick-scraper/octoparse-results/Songkick-Columbus.20241027.output.json")
//let inputJsonFile = require("../scripts/songkick-scraper/octoparse-results/songkick-santa-fe.20231206.output.json")
//let inputJsonFile = require("../scripts/songkick-scraper/octoparse-results/Songkick-SaltLakeCity.20241027.output.json")
//let inputJsonFile = null;

/**
 * fetch_metro_events_file
 * @desc stub to return json instead of live
 * @returns inputJsonFile - output from
 */
function fetch_metro_events_from_file() {
	return new Promise(function (done, fail) {
		done(inputJsonFile)
		//done(Los_Angeles_Songkick_parsed.slice(0,5))
		// done(revivalists)
		//done(_9480.slice(0,5))
	})
}

//todo:
/**
 * get upcoming events for a metro and process the artists and genres by either:
 * - confirming that my SQL DB has a spotify to songkick artist relationship with genres
 * - searching with spotify and committing new matches to SQL DB
 * also, commit the fetched events to mongo
 * @param req.body
 * {
 *	"metro":{"displayName":"Columbus","id":9480},
 *	"dateFilter":{"start":"2020-02-29T16:36:07.100Z","end":"2020-03-06T16:36:07.100Z"}
 *}
 **/
module.exports.fetchMetroEvents = async function (req, res) {
	//testing: how we do these batch calls (just setting the req.body.spotifyApi
	//as if it was coming from the UI so everything shoooould just be seemless)
	//don't like having to wrap like this though - at least it ALREADY looks like garbage!

	try {
		req.body.spotifyApi = await spotify_api.getCheatyToken()

		/**
		 * @function validate specified or create new req.body.dateFilter values
		 * @param req
		 */
		function validateDefineDateRange(req) {

			if (!req.body.dateFilter) {
				req.body.dateFilter = {
					start: new Date().toISOString(),
					end: null
				}
				console.info(`dateFilter not provided. dateFilter defaults to now() to infinity:`, req.body.dateFilter)
			} else {
				//adding days to current date
				if (req.body.dateFilter.days) {
					Date.prototype.addDays = function (days) {
						var date = new Date(this.valueOf());
						date.setDate(date.getDate() + days);
						return date;
					};
					req.body.dateFilter.start = new Date().toISOString()
					req.body.dateFilter.end = new Date().addDays(req.body.dateFilter.days).toISOString();
					console.info(`detected dateFilter.days: "${req.body.dateFilter.days}". dateFilter values:`, req.body.dateFilter)
				} else {
					//todo: what is this for?
					const startDateCache = new Date(req.body.dateFilter.start);

					if (new Date(req.body.dateFilter.start) > new Date()) {
						// res.status(500).send({error: "start date comes after current date"})
						console.warn("warning: start date comes after current date")

					} else if (new Date(req.body.dateFilter.end) < new Date(req.body.dateFilter.start)) {
						res.status(500).send({error: "end date comes before start date"})
					} else {
						console.info(`dateFilter values:`, req.body.dateFilter)
					}
				}
			}
		}

		validateDefineDateRange(req)

		//todo: what is this for?
		const startDateCache = new Date(req.body.dateFilter.start);

		//testing: input result of octoparse.preparse
		let events = await fetch_metro_events_from_file()
		// let events =  await fetch_metro_events(req.body.metro, req.body.dateFilter)

		debugger
		//testing:

		// events = events.splice(0, 10)
		// 		// console.warn("clipping events results to 10!!!");

		//events = events.filter(e =>{return e.displayName === "Boogie T.Rio and Manic Focus"})


		//this object . we will record this in our logs so that we can tell:
		//todo: is aas_match being filled with either spotify or songkick genre data an issue?

		/**
		 * acts as a record tracker of the result of this run of fetch_metro_events
		 * @class metrOb
		 * @prop artists - total # of artists from this run
		 * @prop aas_match - we already linked songkick-spotify to
		 * @prop aas_match_genres - "" and found genres from either spotify OR songkick
		 *
		 * @prop DISABLED leven_match - # new aas_matches we formed from w/ Leven
		 * @prop spotify_match - # new aas_matches we formed from w/ Spotify free text artist search
		 */

		var metrOb = {
			metro: req.body.metro,
			dateFilter: req.body.dateFilter,
			artists: [],
			aas_match_no_genres: [],
			aas_match_no_match: [],
			aas_match_genres: [],
			//leven_match: [],
			spotify_match: [],
			payload: [],
		};

		//todo: Spotify search is unable to handle artist subnames AT ALL
		//you would think it would be SOMEWHERE in 20 results but alas it is not...
		// ex: full_name: "Brian Sauer & The Amazing Waste"
		// sub_name: "Brian Sauer"

		//was thinking about splitting songkick artist names at tokens "and" and "&"
		//and therefore possibly submitting multiple strings per songkick artist, but this starts
		//to get a little complicated later.
		//so say I found a match I could possibly store multiple artist-artistsongkick
		//records if I match on both full_name and sub_name ... then later need to choose
		//one to use...

		// for (var x = 0; x < r.result.artists.items.length; x++) {
		// 		// 	let item = r.result.artists.items[x]
		// 		// 	item.name_split = [];
		// 		// 	item.name_split.push(item.name)
		// 		// 	if (item.name.includes("and") || item.name.includes("&")) {
		// 		// 		item.name_split = item.name.split(/ and | & /);
		// 		// 	}
		// 		// 	item.name_split.forEach(name_string =>{
		// 		// 		//...
		// 		// 	})
		// 		// }

		var ass_db_match_promises = [];

		let performance_artist_dedup_map = {};
		events.forEach(ob => {
			ob.performance.forEach(p => {
				var a = {id: p.artist.id, name: p.artist.displayName};
				if (!performance_artist_dedup_map[a.id]) {
					performance_artist_dedup_map[a.id] = a;
					metrOb.artists.push(a);
					ass_db_match_promises.push(db_api.checkDBFor_artist_artistSongkick_match(a))
				}
			})
		});


		console.info("artists from events to process: ", metrOb.artists.length);

		//note: check if we ALREADY KNOW OF a match between songkick and spotify
		let aas_db_match_results = await Promise.all(ass_db_match_promises)

		//testing: disabled LevenMatch SQL processing
		//var LevenMatch = [];
		//note: at some point I implemented some fuzzy logic that would attempt to partial match
		//on unknown artists in the db. disabled for now b/c I have no idea what this was all about
		//example: LevenMatch.push(db_api.checkDBForArtistLevenMatch({name:"earth gang",id:1234324}));

		//note: separate results into
		// - matched (w/ genres) - great!
		// - matched w/ no genres - I've tried and failed to resolve this songkick artist before
		//   so I'm not going to try again and I can't use them
		// - aas_match_no_match - I've never tried to resolve this songkick artist before

		//todo: seems like at some point the meaning of 'matched' changed...
		//w/ sql completely empty, we still return r.genres.length === 0 soooo
		//what did I mean by "aas_match_no_genres"? seems like that should be "aas_match_no_match",
		//which I just created as of writing this



		aas_db_match_results.forEach(r => {
			if (r.notFound) {
				metrOb.aas_match_no_match.push(r)
			} else if (r.genres.length > 0) {
				//matched w/ genres
				metrOb.aas_match_genres.push(r)
			} else if (r.genres.length === 0) {
				//matched w/ no genres
				metrOb.aas_match_no_genres.push(r);
			} else {
				//checkDBFor_artist_artistSongkick_match returned an invalid result (will always have genres)
				debugger
			}
		});

		console.info("metrOb.aas_match_genres", metrOb.aas_match_genres.length);
		console.info("metrOb.aas_match_no_genres", metrOb.aas_match_no_genres.length);
		console.info("metrOb.aas_match_no_match", metrOb.aas_match_no_match.length);

		var spotifySearchPromises = [];

		function prepareSpotifyArtistSearchQueries(metrOb) {

			//create temporary matchedMap of artist's who we don't need to search for b/c we found in SQL
			var matchedMap = {}
			let aas_matched = metrOb.aas_match_no_genres.concat(metrOb.aas_match_genres)
			aas_matched.forEach(r => {
				matchedMap[r.id] = r;
			})


			aas_db_match_results.forEach(r => {

				if (matchedMap[r.id]) {
					//we don't need to search because we already know the artist:
					// - they had genres = qualified spotify-songkick w/ genres
					// - they didn't have genres = qualified spotify-songkick w/ no genres
				} else {

					//todo: okay so this is a little fucky
					//AASMatch returns two different types of objects, but they are too similar looking
					//if we pass a full 'found artist' to searchArtist, things will fuck up

					//TODO: FUCK THIS FUCKING BULLSHIT
					//I can't figure out how searchArtist is producing an mssql promise rejection, so I'm just going to commit
					//to marking spotify artists in my db with a flag for whether or not we've tried to match them with songkick already
					//THEN there will NEVER be a repeat request to searchArtist and this will somehow fix it??

					//todo: according to comments below, notFound = couldn't find GENRES, not necessarily a MATCH
					//so these songkick artist's w/ spotify match, but the match doesn't have any genres

					if (r.notFound) {

						//note: basically just providing the spotifyApi for this searchArtist by imitating a req from the UI
						spotifySearchPromises.push(limiter.schedule({id: "https://api.spotify.com/v1/search | " + r.id + " | " + r.name.replace(" ", "-")}, spotify_api.searchArtist, {
							body: {
								artist: r,
								spotifyApi: req.body.spotifyApi
							}
						}, {}))
					} else {
						//testing: shouldn't be able to get here
						debugger;

					}
				}
			});
		}

		prepareSpotifyArtistSearchQueries(metrOb)

		//testing:
		//searches = searches.slice(0,5)
		//console.warn("clipping total searches to 5!!!");
		console.info("spotify searchArtists queries:", spotifySearchPromises.length);


		//note: execute spotify searches
		//note: these results look like this:
		// {artist:<songkickArtist>
		// result:{artists:{items:<spotifyArtist>}}}

		let spotifySearchResults = await Promise.all(spotifySearchPromises)


		//look like: {artist:{},result:{}}
		//console.info("$searches",app.jstr(results[0]));

		var newMatches = [];
		var newMatches_genres = [];
		var rejectedMatches = [];
		var spotifySearch_artists_noMatches = [];
		var spotifySearch_artists_noGenres = []

		//todo:
		//note: apparantly the commit calls return ... something interesting
		var commit_artistSongkick_with_match_results = [];

		var aas_promises = [];

		// aas_promises.push(db_api.setFG());
		var topTracksProms = [];

		//testing: didn't plan this thru
		var songkickSpotifyMap = {};

		//note: commit matched [artist,artistSongkick,artist_artistSongkick]
		//note: recall 'results' come from artistSongkicks' we couldn't find
		//so if we couldn't find a search result, we quit
		//but if we do, we know it's also a new artist_artistSongkick entry


		//note: process search results
		spotifySearchResults.forEach(r => {

			//note: couldn't find any matches for the artist

			//todo: dbl check necessary?
			//todo: larger requests are sometimes timing out?
			if (!(r.result) || r.result.artists.items === null || r.result.artists.items.length === 0) {
				spotifySearch_artists_noMatches.push(r.artist)
			}

			//note: found matches for artist, so fuzzy check them and submit artist, artist_songkick and match to db
			else {

				let fuzzyCheckAristResults = function () {
					//for each artist - items pairing, see if we can find 1 item that passes.
					// when we do, flip match_failure to false and break


					r.match_failure = true;

					//note: sometimes spotify will prioritize a more POPULAR? artist then an exact
					//MATCH on my search, so sanity check before trying anything else
					//case: r.artist.name = "Shaker"
					// - first item.name = "Shakey Graves"
					// - later on you see item.name = "Shaker"

					for (var x = 0; x < r.result.artists.items.length; x++) {
						let item = r.result.artists.items[x]

						if(item.name === r.artist.name){

							//todo: copying what fuzzyMatch returns,
							//which is icky b/c I'm sure this will confuse me later while debugging
							let match_summary = {
								match_string: item.name,
								match_against_string: r.artist.name,
							}
							r.match_failure = false;
							r.match_result = {result: true, result_reason: "pre-fuzzy match",match_summary:match_summary}
							r.match = item;
							return 0;
						}
					}

					for (var x = 0; x < r.result.artists.items.length; x++) {

						let item = r.result.artists.items[x]
						//let failed_match_results = []
						let match_result = fuzzyMatch.processFuzzy(item.name, r.artist.name)
						if (match_result.result === false) {
							if(!r.match_failures){
								r.match_failures = [];
							}
							r.match_failures.push(match_result)
						} else {
							r.match_failure = false;
							r.match_result = match_result;
							r.match = item;
							break;
						}
					}
				}

				fuzzyCheckAristResults()

				if(r.match_failure){
					console.warn(JSON.stringify(r,null,4))
					debugger
				}

				if(!r.match_failure){
					var artist = JSON.parse(JSON.stringify(r.match));
					var artistSongkick = JSON.parse(JSON.stringify(r.artist));

					var artist_artistSongkick = {
						artist_id: artist.id,
						artistSongkick_id: artistSongkick.id
					}

					//testing: needs to be reduced
					artistSongkick = {id: artistSongkick.id, displayName: artistSongkick.name}
					//todo:# b/c results can be different somehow if I didn't find versus I did find???
					// artistSongkick.id = artistSongkick.artistSongkick_id
					// delete artistSongkick.artistSongkick_id

					//todo: check when used later
					songkickSpotifyMap[artist.id] = artistSongkick.id;

					//note: if we got here, we know there is at least no CORRELATION between an artist and artistSongkick
					//but it's possible we've already stored the artist w/ genres

					aas_promises.push(db_api.commit_artistSongkick_with_match(artist, artistSongkick, artist_artistSongkick));

					//todo: bc we mutated it? or does this just not mater anyways right? we don't NEED to return anything here
					commit_artistSongkick_with_match_results.push(artistSongkick)

					if (artist.genres.length === 0) {
						spotifySearch_artists_noGenres.push(artist)
					}
				}
			}//else matched
		})//results.each

		//testing:
		console.info("spotifySearch_artists_noMatches", spotifySearch_artists_noMatches.length);
		console.info("spotifySearch_artists_noGenres", spotifySearch_artists_noGenres.length);

		console.info("committing new artist-artistSongkick matches", aas_promises.length);

		// console.info(rejectedMatches);
		// console.info(newMatches);

		//note: submit all matches to DB + insert raw events into mongo
		aas_promises.push(db_mongo_api.insert(events));

		Promise.all(aas_promises).then(r => {
			// db_mongo_api.insert(events).then(r => {
			//console.info("4====================");
			//console.info(r);
			console.info("fetchMetroEvents finished execution:", Math.abs(new Date() - startDateCache) / 600);
			console.info("all events, artists and genres committed!");

			res.send({
				artist_artistSongkick_committed: commit_artistSongkick_with_match_results,
				spotifySearch_artists_noMatches: spotifySearch_artists_noMatches
			})

		}, error => {
			console.info("mongo events insert error", error);
		})


		//puppets

		var puppets = [];
		// //console.info("$levenMatch",app.jstr(results));
		// results.forEach(r =>{
		// 	if(!(r.error)){
		// 		//should be artist objects w/ genres
		// 		metrOb.db.push(r);
		// 	}else{
		// 		puppets.push(puppet(r))
		// 	}
		// })

		//console.info("metrOb",app.jstr(metrOb));


		// Promise.all(puppets).then(results2 => {
		// 	console.info("$results2",app.jstr(results2));
		// },error =>{ console.info("$puppets",error);})

		// },error =>{ console.info("$LevenMatch",error);})

		//expecting a playob so we'll wrap this here
		// db_api.checkDBForArtistGenres({artists:artists}).then(r =>{
		// 	console.info("checkDBForArtistGenres:",r);
		// })
		//aggregator.bandsintown

		//testing:
		//res.send(results);
		//}

	} catch (e) {
		console.error(e)
	}
};

module.exports.get_metro_events_local = function (req) {
	return new Promise(function (done, fail) {

		var callback = function (res) {
			done({data: res})
		};

		module.exports.get_metro_events(req, {}, callback)

	})
};

/**
 * pull cached events from mongo and fully qualify the artist using checkDBFor_artist_artistSongkick_match
 * @function resolveEvents
 * @param req.body{
 *	"metro":{"displayName":"Columbus",
 *		"id":9480}
 *}
 **/
module.exports.resolveEvents = function (req, res, next) {

	console.info("resolveEvents", req.body);

	let mongo_query;
	if (!req.body.metro) {
		mongo_query = "all"
	} else {
		//testing: CHANGED THIS TO DISPLAYNAME INSTEAD OF ID
		mongo_query = req.body.metro.displayName.toString()
	}

	db_mongo_api.fetch(mongo_query)
		.then(events => {
			//console.info(app.jstr(events));
			console.info("fetched events:", events.length);

			var promises = [];
			var perfMap = {}
			events.forEach(e => {
				e.performance.forEach(p => {
					perfMap[p.id] = p;

					//trying a little trick to send ancillary data with request
					async function check(artist, perf) {
						var match = await db_api.checkDBFor_artist_artistSongkick_match(artist);

						return {match: match, perf: perf}
					}

					promises.push(check(p.artist, p));
				});
			});
			Promise.all(promises).then(results => {
				console.info("checkDB prom finish: ", results.length);

				//todo: speed up unwinding

				//setting perfMap earlier + sending perf along helps unwind results
				results.forEach(r => {
					perfMap[r.perf.id].artist = r.match;
				});


				//but binding them back is still n^n (although, mostly not too many performances)
				events.forEach(e => {
					e.performance.forEach(p => {
						p = perfMap[p.id]
					})
				});
				res.send(events);
			}, e => {
				debugger;
				console.error("resolveEvents failure", e)
			})

		})

};


//testing: recall songkick api doesn't do 'users' so I can pull any user's calender
module.exports.fetchUserEvents = function (req, res, next) {
	return new Promise(function (done, fail) {

		var testUser = 'complacent.citizen'
		var page_count = 1;
		var get = function () {
			var params = {};
			params.page = page_count
			params.per_page = 50;
			console.info("getting getUserUpcomingEvents:", testUser)
			songkickApi.getUserUpcomingEvents(testUser, {attendance: 'all', page: page_count, per_page: 50})
				.then(r => {
					console.log(r);
					debugger
				}).catch(e => {
				console.error(e);
			})

			//testing:
			// if(events.length < 50 || (result.events.length === 0 && all_results.length !== 0)){
			//
			// 	console.info("invariant tripped. stopping.");
			// 	done1(all_results)
			// }
			// else{
			// 	page_count++;
			// 	get()
			// }
		};

		get()

	})
};


module.exports.searchArtistSongkick = async function (artistOb, artistSongkick_id) {
	try {
		var sres = await songkickApi.searchArtists({query: artistOb.name});
		return sres?.[0] || null

		//note: had planned on checking if I had incoming artistIdSongkick
		// - if so, get their events; otherwise, search for them so I can get events

		//getArtistUpcomingEvents
		//sres[0] ? fetchId = sres[0].id:{};
		//var events = await songkickApi.getArtistUpcomingEvents(fetchId)

	} catch (error) {
		console.error(error);
		// expected output: ReferenceError: nonExistentFunction is not defined
		// Note - error messages will vary depending on browser
	}


}

//testing:
//module.exports.fuzzy_compare = fuzzy_compare;


// var raw = "raw_" + metro_select.displayName +"_" + dateFilter.start + "-" + dateFilter.end + ".json"
// var areaDatesArtists = "areaDatesArtists_" + metro_select.displayName +"_" + dateFilter.start + "-" + dateFilter.end + ".json"

//todo: executing these sequentially giving me some issue

// get_metro_events(metro_select,dateFilter,raw,areaDatesArtists)
// 	.then(function(){
// 		console.info("finished get_metro_events");
// 	});

//var artist_input = "my_artists.json";
// // var artist_input = "aubrey_123073652_artists.json";
//var artist_input = "aubrey_123073652_dacandyman01_artists.json";
// var artist_input = "aubrey_123073652_dacandyman01_artists_genre.json";
//
//
// var my_artists = require("./../authorization_code/public/" + artist_input).artists;
//
// var my_performances = require("./" + areaDatesArtists).result;
//
// var matches = "matches_" + metro_select.displayName +"_" + dateFilter.start + "-" + dateFilter.end + ".json"
//
// console.info("artist input: ",artist_input);
// console.info("events input: ",areaDatesArtists);
//
// fuzzy_compare(my_performances,my_artists,matches)
// 	.then(function(){
// 		console.info("finished fuzzy_compare");
// 	});


// get_metro_events(metro_select,dateFilter,raw,areaDatesArtists)
// 	.then(fuzzy_compare(my_performances,my_artists))
// 	.then(function(){
// 		console.info("FINISHED!");
//
// });

// fuzzy_compare(my_performances,my_artists,matches)
// 	.then(function(){
// 		console.info("finished fuzzy_compare");
// 	});

// const promiseSerial = funcs =>
// 	funcs.reduce((promise, func) =>
// 			promise.then(result => func().then(Array.prototype.concat.bind(result))),
// 		Promise.resolve([]))
//

// var funcs = [];
// funcs.push(get_metro_events(metro_select,dateFilter,raw,areaDatesArtists))
// funcs.push(fuzzy_compare(my_performances,my_artists))
//
// // execute Promises in serial
// promiseSerial(funcs)
// 	.then(function(){
// 		console.info("FINISHED!")
// 	})
// 	.catch(function(err){
// 		console.info("ERROR",err)
// 	})
//


// var tasks = [];
// tasks.push(get_metro_events(metro_select,dateFilter,raw,areaDatesArtists))
// tasks.push(fuzzy_compare(my_performances,my_artists))
// // const tasks = getTaskArray();
// return tasks.reduce((promiseChain, currentTask) => {
// 	return promiseChain.then(chainResults =>
// 		currentTask.then(currentResult =>
// 			[ ...chainResults, currentResult ]
// 		)
// 	);
// }, Promise.resolve([])).then(arrayOfResults => {
// 	// Do something with all results
// });


