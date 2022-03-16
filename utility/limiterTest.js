const fetch = require('node-fetch');
var Bottleneck = require("bottleneck");
//const fetchRetry = require('./limiter').fetchRetry
const resolver_api = require('../resolver_api')
var rp = require('request-promise');

var limiterSpotify = new Bottleneck({
	// maxConcurrent: 1000,
	// minTime: 100,
	trackDoneStatus: true
});

limiterSpotify.on("failed", async (error, jobInfo) => {
	debugger
	const id = jobInfo.options.id;
	console.warn(`Job ${id} failed: ${error}`);
	// if (jobInfo.retryCount === 0) { // Here we only retry once
	console.log(`Retrying job ${id} in` + error.retryAfter * 1000);
	return error.retryAfter* 1000;
	//}
});

module.exports.test1 =  function(req){
	return new Promise(function(done, fail) {
		//searches.push(limiterSpotify.schedule(spotify_api.searchArtist,{body:{artist:r,spotifyApi:req.body.spotifyApi}},{}))
		var proms = []

		// for(var x = 0; x< 1000;x++){
		// 	//proms.push(limiterSpotify.schedule(resolver_api.spotifyArtists,[["test","test"],["test2","test2"]],req))
		// 	limiterSpotify.schedule(resolver_api.spotifyArtists,[["test","test"],["test2","test2"]],req)
		// }

		// var processTask = function(x){
		// 	debugger
		// }
		// limiterSpotify.schedule(() => {
		// 	const allTasks = proms.map(x => processTask(x));
		// 	// GOOD, we wait until all tasks are done.
		// 	return Promise.all(allTasks);
		// });

		// Promise.all(proms)
		// 	.then(r =>{
		// 		debugger
		// 	},e=>{
		// 		debugger
		// 	})
	})
}



module.exports.test =  function(req){
	return new Promise(function(done, fail) {
		// Restrict us to one request per second


//docs:
//https://developer.spotify.com/documentation/web-api/guides/rate-limits/

		//Spotify’s API rate limit is calculated based on the number of calls that your app makes to Spotify in a rolling 30 second window.
		//todo: so what is my max for 30s? idk

		//docs:
		//https://github.com/SGrondin/bottleneck
		var limiter = new Bottleneck({
			// maxConcurrent: 10,
			//minTime: 100,
			//testing: at 86~89 it starts failing
			trackDoneStatus: true
		});


		//todo: surely the fastest way is to let us burst and then
		//react to the first failure by adjusting the settings right?

		//todo: b/c we're working on a thirty second window
		//testin here can be tricky b/c unless you let the whole quota reset,
		//results will obviously vary... anything I've recorded below is: 1ST | 2ND run in a row

		//so all that together means that the limiter needs to understand how bad the quota is when
		//it begins executing jobs and react to that?

		//because the goal is to MINIMIZE retry wait period I guess?
		//but WHEN QUOTA IS HIGH does the strategy matter at all?
		//what about average total # of jobs?
		//what about multiple processes trying to use it at same time?

		var target = 200;
		var mod = 1000
		// - 33.51s NO CONFIG,  r* 1000
		// - 12.5s | 19.5s - 32s NO CONFIG, r*500

		var target = 200;
		var mod = 500
		// - 33.51s NO CONFIG,  r* 1000
		// - 12.5s | 19.5s - 32s NO CONFIG, r*500
		limiter.on("failed", async (error, jobInfo) => {
			const id = jobInfo.options.id;
			console.warn(`Job ${id} failed: ${error}`);
			var r = error.response.headers['retry-after']
			console.log(`Retrying job ${id} in` + r* mod);
			limiter.updateSettings({minTime:50});
			//debugger
			return r* mod;
		});


		var queries = ["London","Paris","Rome","New York","Cairo"];
		for(var x = 0; x< target;x++){
			//proms.push(limiterSpotify.schedule(resolver_api.spotifyArtists,[["test","test"],["test2","test2"]],req))
			//limiterSpotify.schedule(resolver_api.spotifyArtists,[["test","test"],["test2","test2"]],req)
			queries.push(x + "" + queries[x%5] )
		}

		//locations = locations.concat(locations).concat(locations).concat(locations)

		var inter =  function(options){
				//stuff
				return limiter.schedule(rp,options)
		}
		var task = function (options) {
			return inter(options)
			//return limiter.schedule(rp,options)
				.then(function (response) {

					console.log(response.artists.href);
					//
					return response
					// console.log('result', response);
				})
				.catch(function (err) {
					debugger
					throw err
					//fail()
					// API call failed...
				});
		}
		var ops = queries.map(q =>{
			let url_pre = "https://api.spotify.com/v1/search?q=";
			let url_suf = "&type=artist";
			let options = {
				uri: url_pre + q  + url_suf,
				headers: {
					'User-Agent': 'Request-Promise',
					"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()
				},
				json: true
			};
			return options
		});
		var ps = ops.map(task);
		//debugger
		Promise.all(ps)
			.then(r =>{done(r)},e =>{})
	})
}

