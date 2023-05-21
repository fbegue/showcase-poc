var rp = require('request-promise');
const sApi = require('./apis/spotify_api')
// var fetchTry = require('./utility/limiter').fetchTry
var fetchTry = require('./utility/network_utility').fetchTry
var limiter = require('./utility/network_utility').limiter
var async = require('async')
const fetch = require('node-fetch');

//todo: started working on it but realized this is songkick specific
//designed to take in songkickArtist objects like {id: #######, displayName:""}
//todo: combine with spotify_api.searchSpotify

module.exports.spotifySearch  = function(artist){
	return new Promise(function(done, fail) {
		// console.log("search_artists",JSON.stringify(req.body,null,4));
		// console.log("search",req.body.artist.name);
		// console.log("search",req.body.artistSongkick_id);

		//let artist = req.body.artist;

		let options = {
			uri: "",
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization":'Bearer ' + req.body.token
			},
			json: true
		};

		let url_pre = "https://api.spotify.com/v1/search?q=";
		let url_suf = "&type=artist";
		let tuple = {};

		var searchReq =  function(options){
			return new Promise(function(done, fail) {
				let op = JSON.parse(JSON.stringify(options));
				fetchTry(options.uri,options).then(function(res){
					//  console.log(res);
					// console.log(op);
					//todo: in the future, probably need better checking on this
					//maybe some kind of memory system where, if there's an ambiguous artist name
					//and I make a correct link, I can save that knowledge to lean on later
					tuple = {};
					tuple = {artistSongkick_id:op.artistSongkick_id};
					tuple.artist = {};
					tuple.artist.name = op.displayName;

					if(res.artists.items.length > 0){
						tuple.artist = res.artists.items[0]
						if(tuple.artist.genres.length ===0){
							tuple.error = true;
							tuple.noGenresFound = true;
						}
					}
					else{
						tuple.error = true;
						tuple.artistSearch = op.displayName_clean;
					}
					done(tuple)
				}).catch(function(e){
					console.log("searchReq failure",e);
					fail(e)
				});
			})
		};

		//todo: where does the US thing come into play again?
		let nameClean = artist.name.replace(/\(US\)/g, ""); //%20

		//cleaning out non-alphabeticals
		//ex: 'Zoso – the Ultimate Led Zeppelin Experience'
		//that's not a hyphen

		nameClean = nameClean.replace(/[^a-zA-Z\s]/g, ""); //%20

		//todo: clean up input to searchReq
		options.uri = url_pre + nameClean  + url_suf;
		options.artistSongkick_id = req.body.artistSongkick_id;
		options.displayName = artist.name;
		options.displayName_clean = nameClean;

		//todo: only output from spotify
		//console.log(options.uri);

		searchReq(options)
			.then(function(result) {
				//console.log(JSON.stringify(result));
				done(result)
				// res.send(result);

			}).catch(function(err){
			let msg = "spotify search artist failure";
			let error = {msg:msg,artist:req.body.artist.name,error:err};
			//console.error(error);
			fail(error)
		})
	})
};

/**
 * spotifyArtists
 * Resolves payloads of artist ids
 * @param payload An array of 50 artist ids
 * @returns {Promise<unknown>}
 */

var test =  function(r){
    return new Promise(function(done, fail) {
		console.log("test",r);
    done(r)
    })
}

var wait =  function(input,timeout){
	return new Promise(function(done, fail) {
		console.log("retry-after...",timeout);
		setTimeout(e =>{done(input)},timeout)
	})
}
module.exports.spotifyArtists = function(req,payload){

		//console.log("spotifyArtists payload",payload.length);
		var multiArtistStr = "";
		payload.forEach(function(id,i){
			multiArtistStr = multiArtistStr + id + ","
			//!(i % 50 === 0) ? multiArtistStr = multiArtistStr + ",":{};
		});
		multiArtistStr = multiArtistStr.substring(0,multiArtistStr.length - 1)

		let uri = "https://api.spotify.com/v1/artists?ids="+ multiArtistStr;
		let options = {
			uri:uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			json: true
		};
		//console.log(options.uri);
		return limiter.schedule(rp,options)
			.catch(e =>{
				debugger
			})

		//--------------------------------------------------------

		var count = 0;
		var myFunction = function(callback, results,) {
			console.log(++count);
			console.log(this);
			process.nextTick(function() {
				if (count < 5) { // Fail 5 times
					return callback({ message: 'this failed' }, null);
				}
				callback(null, { message: 'this succeeded' });
			});
		};

		// var fetchIt = function(callback, results) {
		// 	test().then(r =>{
		// 		callback(null, { message: r });
		// 	},e =>{
		// 		return callback({ message: 'this failed' }, null);
		// 	})
		// }

		var fetchIt = function(callback, results) {
			fetch(this.uri,this)
			// .then(res => res.json())
				.then(res =>{
					if(res.status === 429){
						wait(res,res.headers.get('retry-after'))
							.then(res => res.json())
							.then(r =>{
								return callback({ message: r.error }, null);
							},e =>{
								debugger
							})
						// setTimeout(() =>{
						// 	res.json().then(r =>{
						// 		return callback({ message: r.error }, null);
						// 	},e =>{
						// 		debugger
						// 	})
						//
						// },res.headers.get('retry-after'))

					}else{
						callback(null, res);
					}
			},e =>{
					debugger
				return callback({ message:e }, null);
			})
		}

		// async.retry({times: 3, interval: 500}, fetchIt.bind(options),
		//  function(err, result) {
		// 	if(err){
		// 		debugger
		// 	}else{
		// 		done(result)
		// 	}
		//     // do something with the result
		// });

		//--------------------------------------------------------

		// fetchTry(options.uri,options).then(r => {
		// 	// r.artists.forEach(a =>{
		// 	// 	if(a === null){
		// 	// 		console.log(a);
		// 	// 	}
		// 	// })
		// 	//console.log("$r",r);
		// 	if(r === undefined){
		// 		debugger
		// 	}
		// 	done(r)
		// },err =>{
		// 	fail(err)
		// })
		//--------------------------------------------------------
		//console.log(options.uri)
		//return fetchTry(options.uri,options)
		// 	.then(res =>{
		// 	   done(res)
		// },e =>{
		// 		debugger
		// 	fail(e)
		// })
};


