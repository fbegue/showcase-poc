//repo
//https://github.com/schnogz/songkick-api-node
//All requests to the library will be returned a promise and when resolved the response will be JSON.
var Bottleneck = require("bottleneck");

// var spotifyApi = null;
//
// setTimeout(e =>{
// 	console.info("setup shitty export: spotifyApi");
// 	spotifyApi = require('./spotify_api').spotifyApi;
// },3000)

const apikey = "pdBY8kzaJtEjFrcw"

const Songkick = require('songkick-api-node');
const fs = require('fs')

//https://github.com/Glench/fuzzyset.js
//http://glench.github.io/fuzzyset.js/ui/
const FuzzySet = require('fuzzyset')


const songkickApi = new Songkick(apikey);


//const aggregator = require('./aggregator');
const db_api = require('./db_api');
//const app = require('./app');
//const puppet = require('./puppet').puppet;
//const fetchRetry = require('./spotify_api').fetchRetry;

var db_mongo_api = require('./db_mongo_api')
var spotify_api = require('./spotify_api')


let sql = require('mssql');

let connect = function(){
	console.info("connect...");
	try {
		conn.connect()
			.then((res) => {
				console.info("...success!");

				let sreq = new sql.Request(conn)
				sreq.query('select * from xtest').then((res) => {
					console.info(res);
				})
			})
			.catch(function(err){
				console.info(err);
			});

	} catch (err) {
		console.info(err);
	}
};

//todo: if trying to use localhost SQL server
//connect();




//just checking out raw artist search
var searchArtists = function(){
	//console.info("searchArtists");
	songkickApi.searchArtists({ query: 'Queen' })
		.then((res)=>{
			console.info(JSON.stringify(res[0],null,4));

			if(res[0].identifier){
				res[0].identifier.forEach(function(id){
					console.info(id.mbid);
				})
			}
		})
}
//searchArtists();


//figure out metro ids (i think these are universal location ids for places)

//not sure yet about returns for these - are they always city & metro object pairs:

//[
//    { //one pair which describes the query's possible metro and city result
//        {
//            city:{"..."}
//        },
//        {
//            city:{"..."}
//        }
//    }
//]

//oakland = bay area
//cleveland = Cleveland & Cleveland Heights

var findWithAttr = function(array, attr, value) {
	for(var i = 0; i < array.length; i += 1) {
		if(array[i][attr] === value) {
			return i;
		}
	}
	return -1;
};

var count_properties = function(object){
	var count = 0;
	for (var prop in object) {
		if (object.hasOwnProperty(prop)) {count++}
	}
	return count;
};

var weekday = new Array(7);
weekday[0] =  "Sun";
weekday[1] = "Mon";
weekday[2] = "Tues";
weekday[3] = "Wed";
weekday[4] = "Thurs";
weekday[5] = "Fri";
weekday[6] = "Sat";

var weekday_full = new Array(7);
weekday_full[0] =  "Sunday";
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
var find_metros = function() {
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
				}
				else if (record.metroarea) {
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
	{"displayName":"Columbus",
		"id":9480},
	{"displayName": "Salt Lake City",
		"id":13560},
	{"displayName":"SF Bay Area",
		"id":26330},
	{"displayName":"Cleveland",
		"id":14700},
	{"displayName":"Cincinnati",
		"id":22040},
	{"displayName":"Dayton",
		"id":3673}
];

var dateFilter = {};
dateFilter.start = '2018-07-12';
dateFilter.end = '2018-07-18';

/**
 * then get events upcoming for a single metro
 * @function get_metro_events
 **/
var fetch_metro_events = function(metro,dateFilter){

	return new Promise(function(done, fail) {

		dateFilter.start = new Date(dateFilter.start);
		dateFilter.end = new Date(dateFilter.end);
		console.info(dateFilter.start);
		console.info(dateFilter.end);

		//used for stats in return object
		var event_count = 0;

		var get_events = function(metro){
			return new Promise(function(done1, fail) {
				console.info("get_events");

				var all_results = [];
				var page_count = 0;

				/**
				 * recusively called until page_length invariant stops chain, hence its broken out here
				 * @function get
				 **/
				var get = function(){

					var params = {};
					params.page = page_count;
					params.per_page = 50;

					console.info("getting" + metro.displayName + " " + metro.id + " page {" + page_count + "}...");
					songkickApi.getLocationUpcomingEvents(metro.id,params)
						.then(function(events){

							//console.info(JSON.stringify(events, null,4));

							var filterInRange = function(event){

								var res = true;
								var eDate = new Date(event.start.date)
								// console.info( dateFilter.start + " > "  + eDate +  " < "+ dateFilter.end);
								// console.info( eDate < dateFilter.start)
								// console.info( eDate > dateFilter.end);

								//if start invalid, set false and ignore end value
								//if end invalid, set false and ignore start value unless start is false, then take start

								if(dateFilter.start && dateFilter.end){
									if(eDate < dateFilter.start){	res = false;}
									if(eDate > dateFilter.end || !res){res = false;}

								}else if(dateFilter.start && !dateFilter.end) {
									if(eDate < dateFilter.start){res = false;}

								}else if(!dateFilter.start && dateFilter.end) {
									if(eDate > dateFilter.end){res = false;}
								}
								// console.info(":: " + res);
								// console.info(event.start.date);
								return res;
							};


							var inRange = [];
							var outRange = [];

							for(var x = 0; x < events.length; x++) {

								if (filterInRange(events[x])) {inRange.push(events[x])}
								else {outRange.push(events[x])}
							}

							var result = {}
							result.id = metro.id;
							result.displayName = metro.displayName;
							result.events = inRange;

							//only push non-zero events.length results
							if(result.events.length > 0){
								all_results.push(result)
							}


							//all_results is in array of per-page result.events
							all_results.forEach(function(result){
								event_count = event_count + result.events.length;
							});

							//console.info("--------------------------------");
							//console.info("outrange:",outRange.length);
							//console.info("new events:",result.events.length);
							//console.info("total events:",event_count);
							//console.info("paging invariant:",events.length);

							//if page length is < 50
							//OR if we're starting to get zero-inrange results back, but we have SOME (for dateFilter.start)

							if(events.length < 50 || (result.events.length === 0 && all_results.length !== 0)){

								console.info("invariant tripped. stopping.");
								done1(all_results)
							}
							else{
								page_count++;
								get()
							}
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
		Promise.all(promises).then(function(results){

			//console.info(JSON.stringify(results,null,4));

			//todo: b/c I'm doing one metro?
			results = results[0];

			let events = [];
			let metro_id = results[0].id;
			let ids = {};

			results.forEach(function(result){
				result.events.forEach(function(event){

					//console.info(JSON.parse(JSON.stringify(event)));
					if(ids[event.id]){

					}else{
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
			var write_schedule = function(){
				results.forEach(function(result){

					//console.info("===============");
					//console.info(result);


					// if(result.displayName == "Columbus"){

					result.events.forEach(function(event){


						//todo: handle festivals differently (event.type = 'Festival')
						//performance is an array of artists (headliner, support, etc)
						var performance = {};

						var date = new Date(event.start.date)
						var m = date.getUTCMonth() + 1
						//var d = date.getDate()
						var d = date.getUTCDate()
						var y  = date.getFullYear()
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


						event.performance.forEach(function(perf){
							performance.artists.push(perf.artist.displayName)

						});

						//haven't created entry for date yet
						if(dates.indexOf(newDate) == -1){
							dates.push(newDate);


							performance_dates[newDate] = [];
							performance_dates[newDate].push(performance);
						}
						else{
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
			console.info("# of payloads: ",results.length);
			console.info("events length: ",events.length);
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


		}).catch(function(e){
			console.info(e);
		})

	})

}//getMetroEvents

// var fake_events = require('./example data objects/event.js')
// var fake_metro_events =  function(label,limit){
// 	return new Promise(function(done, fail) {
// 		console.warn("faking events:",label);
// 		console.warn(fake_events[label].length);
// 		done(fake_events[label].splice(0,5))
// 	})
// }

/**
 * get upcoming events for a metro and process the artists and genres, committing them to the db
 * also, commit the events to mongo
 * @function fetchMetroEvents
 * @param req.body{
 *	"metro":{"displayName":"Columbus",
 *		"id":9480},
 *	"dateFilter":{"start":"2020-02-29T16:36:07.100Z","end":"2020-03-06T16:36:07.100Z"}
 *}
 **/

//note: w/out cleaning the DB, the exact same request returns [] the 2nd time
//forget why - doesn't matter as this is just doing db work, not meant to return anything

//testing args: fake_metro_events

	//todo: MOVE
var limiterSpotify = new Bottleneck({
		maxConcurrent: 15,
		minTime: 100,
		trackDoneStatus: true
	});

//todo: holy shit this is bad
// process.on('unhandledRejection', (reason, p) => {
// 	debugger;
// 	if(reason.message === "Validation failed for parameter 'id'. Invalid number."){
//
// 	}else{
// 		console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// 	}
//
// 	// application specific logging, throwing an error, or other logic here
// });

module.exports.fetchMetroEvents =  function(req, res,next){
	//testing: how we do these batch calls (just setting the req.body.spotifyApi
	//as if it was coming from the UI so everything shoooould just be seemless)
	//don't like having to wrap like this though - at least it ALREADY looks like garbage!

	spotify_api.getCheatyToken()
		.then(api =>{
			req.body.spotifyApi = api


			//--------------------------------------------------------------
			//testing:
			if(req.body.dateFilter.days){
				Date.prototype.addDays = function(days) {
					var date = new Date(this.valueOf());
					date.setDate(date.getDate() + days);
					return date;
				};
				//testing:
				req.body.dateFilter.start = new Date().toISOString()
				req.body.dateFilter.end = new Date().addDays(req.body.dateFilter.days).toISOString();
				//req.body.dateFilter.end = new Date().addDays(7).toISOString();
				//req.body.dateFilter.end = new Date().addDays(30).toISOString();
				//req.body.dateFilter.end = new Date().addDays(90).toISOString();
				//req.body.dateFilter.end = new Date().addDays(366).toISOString();

			}

			//--------------------------------------------------------------

			const startDateCache = new Date(req.body.dateFilter.start);

			if (new Date(req.body.dateFilter.start) > new Date()) {
				res.status(500).send({error: "start date comes after current date"})

			}else if(new Date(req.body.dateFilter.end) < new Date(req.body.dateFilter.start)){
				res.status(500).send({error: "end date comes before start date"})
			}
			else {

				console.info("fetchMetroEvents start date:",req.body.dateFilter.start);
				console.info("fetchMetroEvents end date:",req.body.dateFilter.end);
				//testing:
				//fake_metro_events('events',5)
				fetch_metro_events(req.body.metro, req.body.dateFilter)
					.then(function (events) {
						//todo: why was I checking for next here?
						// if (next) {next(events)} else {

						//console.info(app.jstr(results));

						//this object acts as a record tracking the result of this run of
						//fetch_metro_events. we will record this in our logs so that we can tell:

						//todo: is aas_match being filled with either spotify or songkick genre data an issue?

						/**
						 * @class metrOb
						 * @prop artists - total # of artists from this run
						 * @prop aas_match - we already linked songkick-spotify to
						 * @prop aas_match_genres - "" and found genres from either spotify OR songkick
						 *
						 * @prop leven_match - # new aas_matches we formed from w/ Leven
						 * @prop spotify_match - # new aas_matches we formed from w/ Spotify free text artist search
						 */

						var metrOb = {metro:req.body.metro,dateFilter:req.body.dateFilter,
							artists:[], aas_match_no_genres:[],aas_match_genres:[], leven_match:[], spotify_match:[],
							payload:[],
						};

						//is there such thing as lastLook for songkick artists?
						//yes - the lastLook for songkick artists records the last time
						//we hit the db with a levenMatch, spotify free search or puppet/other resolver utilities request?

						//but this lastLook is more than just 'the last time I looked for genres' - here we are also talking
						//about linking songkick artist to spotify - how often do the inputs to those two things change?
						//anytime my NO THE spotify library grows I now have new artists to try to free match on
						//but thats really it as far as newly created linking information goes right? free text is my
						//only method of linking songkick and spotify artists right now.
						//so we just record 'lastLookSpotify' for songkickArtists

						//wheras 'lastLook' for all songkick artists is a json object describing the last time we looked
						//for GENRES in each resolver utility - exactly the same as a spotify artist 'lastLook'


						//so the plan here will be:

						// 1)   check if we know of a match between songkick and spotify
						//      AND pull down existing genre info for:
						//      1.b) just songkick
						//      1.b) the spotify match

						// 2) attempt to leven match on all spotify artists
						// 2.a) pull down genres w/ lastLook on new matches

						// 3 Spotify free text artist search?
						// 4) puppet


						var AASMatch = [];

						//testing:
						//results = results.splice(0,1)
						//console.warn("clipping AASMatch results to 1!!!");
						//console.info(AASMatch[0]);


						events.forEach(ob =>{
							ob.performance.forEach(p =>{
								var a = {id:p.artist.id,name:p.artist.displayName};
								metrOb.artists.push(a);
								AASMatch.push(db_api.checkDBFor_artist_artistSongkick_match(a))
							})
						});

						//console.info("artists",metrOb.artists.length);

						//testing:
						//var death = metrOb.artists.filter(a =>{return a.name === 'Death Valley Girls'});
						//metrOb.artists = metrOb.artists.slice(0,5);
						//metrOb.artists.push(death[0]);
						//console.warn("clipping total artists to 5!!!");
						//console.info(app.jstr(metrOb.artists));


						//note: check if we ALREADY KNOW OF a match between songkick and spotify
						Promise.all(AASMatch).then(results => {

								//var LevenMatch = [];

								//todo: how to parallel these? mixing promises here (2)
								//todo: what is this?
								///results.shift();

								//make a map of the matches we got so we can filter a payload for step (2)
								results.forEach(r =>{

									//recording matches to filter out later
									//and for no matches / genres, pushing onto checkDBForArtistLevenMatch

									if(r.genres.length > 0){

										//matched and found genres. just recording for posterity
										//and filtering out of next step
										metrOb.aas_match_genres.push(r)
									}
									else if(r.genres.length === 0){
										//
										//matched w/ no genres
										metrOb.aas_match_no_genres.push(r);
										//LevenMatch.push(db_api.checkDBForArtistLevenMatch(r))
									}
									else{
										//todo: test
										debugger
										//no match
										//metrOb.aas_match_none.push(r)
										//LevenMatch.push(db_api.checkDBForArtistLevenMatch(r))

									}
								});


								console.info("metrOb.aas_match_no_genres",metrOb.aas_match_no_genres.length);
								console.info("metrOb.aas_match_genres",metrOb.aas_match_genres.length);

								//console.info("LevenMatch payload",LevenMatch.length);

								//testing:
								//LevenMatch.push(db_api.checkDBForArtistLevenMatch({name:"earth gang",id:1234324}));

								//testing: skipping this for now (I was ignoring result anyways)
								//Promise.all(LevenMatch).then(results => {

								var searches = [];
								var artistSongkicksLevenMatches = [];
								var deadSpotify

								//filter out matched reported above
								var matchedMap = {}
								metrOb.aas_match_genres.forEach(r =>{
									matchedMap[r.id] =  r;
								})





								//testing:
								console.warn("auto-failing LevenMatch results");

								//note: r = {id = 8769199,name = "Signs of the Swarm", genres = Array(0),familyAgg = null}
								results.forEach(r =>{
									//testing:
									r.error = true;
									if(r.error === undefined){

										//record LevenMatch we found
										//todo: evaluate these new matches integrity

										metrOb.leven_match.push(r);

										//commit to match to db
										//todo: updated params here
										artistSongkicksLevenMatches.push(db_api.commit_artistSongkick_with_match(r))


										//we couldn't find a match in our db via direct id lookups
										//or my levenmatching, but lets try one more time to link
										//spotify and songkick artists before we just work with the songkick
										//artist and try to resolve genres for it
									}
									else if(matchedMap[r.id]){
										//they had genres = qualified spotify-songkick w/ genres
									}
									else{
										//testing:
										delete r.error;

										//note: basically just providing the spotifyApi for this searchArtist by imitating a req from the UI

										//todo: okay so this is a little fucky
										//AASMatch returns two different types of objects, but they are too similar looking
										//if we pass a full 'found artist' to searchArtist, things will fuck up

										//TODO: FUCK THIS FUCKING BULLSHIT
										//I can't figure out how searchArtist is producing an mssql promise rejection, so I'm just going to commit
										//to marking spotify artists in my db with a flag for whether or not we've tried to match them with songkick already
										//THEN there will NEVER be a repeat request to searchArtist and this will somehow fix it??

										//testing: if
										if(r.notFound){

											// if(r.id === 10184411){
											// 	debugger;
											// }
											//{
											//   "id": 10184411,
											//   "name": "Logan Gallant",
											//   "genres": [],
											//   "notFound": true,
											//   "familyAgg": null
											// }
											searches.push(limiterSpotify.schedule(spotify_api.searchArtist,{body:{artist:r,spotifyApi:req.body.spotifyApi}},{}))
										}
										else{
											//found artist_artistSongkick, but with no genres
											//means we've already binded these, but

											//debugger
											//console.log("");
										}

										// searches.push(limiterSpotify.schedule(spotify_api.searchArtist,{body:{artist:r,spotifyApi:req.body.spotifyApi}},{}))
									}
								});


								//console.info("leven_match",metrOb.leven_match.length);
								console.info("queries #",searches.length);
								//console.info("metrobArtists #",artistSongkicks.length);
								//searches = searches.slice(0,5)
								//console.info("queries #",searches.length);

								//todo: re-enable
								 var combined_promises = artistSongkicksLevenMatches.concat(searches);
								//var combined_promises = searches;
								// var combined_promises = [];

								//note: execute spotify searches
								//note: these results look like this:
								// {artist:<songkickArtist>
								// result:{artists:{items:<spotifyArtist>}}}

								Promise.all(combined_promises).then(results => {

									//look like: {artist:{},result:{}}
									//console.info("$searches",app.jstr(results[0]));

									var newMatches = [];
									var newMatches_genres = [];
									var rejectedMatches = [];
									var noMatches = [];

									//testing: we do a tiny bit of results unwinding but otherwise this is
									//the object we would like to return
									var obs = [];

									var aas_promises = [];

									// aas_promises.push(db_api.setFG());
									var topTracksProms = [];

									//testing: didn't plan this thru
									var songkickSpotifyMap = {};

									//note: commit matched [artist,artistSongkick,artist_artistSongkick]
									//note: recall 'results' come from artistSongkicks' we couldn't find
									//so if we couldn't find a search result, we quit
									//but if we do, we know it's also a new artist_artistSongkick entry


									results.forEach(r =>{
										//todo: dbl check necessary?
										//todo: larger requests are sometimes timing out?
										if(!(r.result) || r.result.artists.items === null || r.result.artists.items.length === 0  ){

											noMatches.push(r.artist)}

										else{
											var artist = JSON.parse(JSON.stringify(r.result.artists.items[0]));
											var artistSongkick= JSON.parse(JSON.stringify(r.artist));

											var artist_artistSongkick = {
												artist_id: artist.id,
												artistSongkick_id: artistSongkick.id
											}
											//todo: #

											//testing: needs to be reduced
											artistSongkick = {id:artistSongkick.id,displayName:artistSongkick.name}
											//todo:# b/c results can be different somehow if I didn't find versus I did find???
											// artistSongkick.id = artistSongkick.artistSongkick_id
											// delete artistSongkick.artistSongkick_id


											//todo: check when used later
											songkickSpotifyMap[artist.id] = artistSongkick.id;

											//note: if we got here, we know there is at least no CORRELATION between an artist and artistSongkick
											//but it's possible we've already stored the artist w/ genres


											aas_promises.push(db_api.commit_artistSongkick_with_match(artist,artistSongkick,artist_artistSongkick));

											//todo: bc we mutated it? or does this just not mater anyways right? we don't NEED to return anything here
											obs.push(artistSongkick)

											//testing: disabled / old as shit
											var processFuzzy = function (item) {
												var a = FuzzySet();
												a.add(item.name);
												if (a.get(item.name) === null || a.get(item.name)[0][0] < .5) {
													rejectedMatches.push([item.name, artist.name])
													console.info("rejection", artist);
													console.info(item.genres);
													console.info(a.get(item.name));
												} else {
													//quality match, no genres means we push onto next payload
													//and we also record this new match
													if (item.genres.length === 0) {
														newMatches.push([item.name, artist.name])
														//todo: next payload

													}
														//new quality match with genres, so skip next payload
													//but we still need to record this
													else {
														newMatches_genres.push([item.name, artist.name])
													}
												}
											}

											//testing: disabled b/c
											//1) didn't feel like fixing an api timeout issue
											//2) don't really feel like this is needed - just have the UI query for songs to play
											async function topTracksAsync() {

												// Promise.all(topTracksProms)
												// 	.then(r => {console.info(r);})
												console.info("topTracksResults...");
												var topTracksResults = await Promise.all(topTracksProms);
												//find the event they belong to and mutate it
												//todo: n^n b/c I took easy way out w/ topTracksProms
												//should have been done inline?
												// var artists = [];


												//create map w/ artist ids
												var artistsTracksMap = {};

												//returns a set of 10 tracks for each artist
												topTracksResults.forEach(tracks => {
													tracks.forEach(t => {
														t.artists.forEach(a => {
															//todo: trimming this result to just ids
															artistsTracksMap[a.id] = tracks.map(t => t.id)
															//artistsTracksMap[a.name] = ids
														})
													})
												})
												//artists = r.body.tracks[0].artists.map(i => {return i.id});

												console.info(Object.keys(songkickSpotifyMap).length);
												events.forEach(e => {
													//for each performance, if we saved the mapping of the artist
													//set their topfive = to the spotify tracks map
													e.performance.forEach((p, i, array) => {
														if (songkickSpotifyMap[p.artist.id]) {
															array[i].artist.spotifyTopFive = artistsTracksMap[songkickSpotifyMap[p.artist.id]]
														}
													})
													// var id = _.get()
													// artists.forEach(id =>{
													// 	var a = _.find(e.performance,['artist.id', id]);
													// })
													//console.info(artist.id);
												})

												// console.info(JSON.stringify(events));
												//just tagging this on here
												console.log("aas_promises...");
												aas_promises.push(db_mongo_api.insert(events));
												const result = await Promise.all(aas_promises)
												return null;
											}
										}

									})//results.each

									//testing:
									console.info("no artist-artistSongkick Matches",noMatches.length);
									console.info("committing new artist-artistSongkick matches",aas_promises.length);
									// console.info(rejectedMatches);
									// console.info(newMatches);


									// topTracksAsync().then(r => {
									// Promise.all(aas_promises).then(r => {
									aas_promises.push(db_mongo_api.insert(events));
									Promise.all(aas_promises).then(r => {
										// db_mongo_api.insert(events).then(r => {
										//console.info("4====================");
										//console.info(r);
										console.info("fetchMetroEvents finished execution:",Math.abs(new Date() - startDateCache) / 600);
										console.info("all events, artists and genres committed!");

										res.send(obs)
										//done(obs)
									}, error =>{ console.info("mongo events insert error",error);})

								},error =>{ console.info("$searches error",error);})

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
							},
							error =>{ console.info("$AASMatch",error);})

						//expecting a playob so we'll wrap this here
						// db_api.checkDBForArtistGenres({artists:artists}).then(r =>{
						// 	console.info("checkDBForArtistGenres:",r);
						// })
						//aggregator.bandsintown

						//testing:
						//res.send(results);
						//}
					}).catch(e =>{
					console.error(e)})
			}
		})

};

module.exports.get_metro_events_local=  function(req){
	return new Promise(function(done, fail) {

		var callback = function(res){
			done({data:res})
		};

		module.exports.get_metro_events(req,{},callback)

	})
};

/**
 * pull cached events from mongo and fully qualify the artist
 * @function resolveEvents
 * @param req.body{
 *	"metro":{"displayName":"Columbus",
 *		"id":9480}
 *}
 **/
module.exports.resolveEvents=  function(req,res,next){

	//todo: ajax weirdness
	console.info("resolveEvents",{metros:req.body.metros,dateFilter:req.body.dateFilter});
	// if(req.body){//postman
	// }else{ req.body = JSON.parse(req.body.data);}

	//todo: just going to fetch them all for now
	//until I figure out proper caching on front end
	//metros are full metro objects
	// db_mongo_api.fetch(req.body.metros)

	db_mongo_api.fetch('all')
		.then(events =>{
			//console.info(app.jstr(events));
			console.info("fetched events:",events.length);
			var promises = [];
			var perfMap = {}
			events.forEach(e =>{
				e.performance.forEach(p =>{
					perfMap[p.id] = p;
					//trying a little trick to send ancillary data with request
					async function check(artist,perf) {
						var match  = await db_api.checkDBFor_artist_artistSongkick_match(artist);
						return {match:match,perf:perf}
					}
					promises.push(check(p.artist,p));
				});
			});
			Promise.all(promises).then(results =>{
				console.info("checkDB prom finish: ",results.length);

				//todo: speed up unwinding

				//setting perfMap earlier + sending perf along helps unwind results
				results.forEach(r =>{
					perfMap[r.perf.id].artist = r.match;
				});

				//but binding them back is still n^n (although, mostly not too many performances)
				events.forEach(e =>{
					e.performance.forEach(p =>{
						p = perfMap[p.id]
					})
				});
				res.send(events);
			},e =>{
				debugger;
				console.error("resolveEvents failure",e)
			})

		})

};


//testing: recall songkick api doesn't do 'users' so I can pull any user's calender
module.exports.fetchUserEvents =  function(req, res,next){
	return new Promise(function(done, fail) {

		var testUser = 'complacent.citizen'
		var page_count = 1;
		var get = function(){
			var params = {};
			params.page = page_count
			params.per_page = 50;
			console.info("getting getUserUpcomingEvents:",testUser)
			songkickApi.getUserUpcomingEvents(testUser, { attendance: 'all', page: page_count, per_page: 50 })
				.then(r =>{
					console.log(r);
					debugger
				}).catch(e =>{console.error(e);})

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


