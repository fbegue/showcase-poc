var SpotifyWebApi = require('spotify-web-api-node');

var PromiseThrottle = require("promise-throttle");
var rp = require('request-promise');
const fetch = require('node-fetch');
let sql = require("mssql")
var _ = require('lodash')
const transform = require('lodash').transform
const isEqual = require('lodash').isEqual
const isArray = require('lodash').isArray
const isObject = require('lodash').isObject
//const jsonfile = require('jsonfile')
var Bottleneck = require("bottleneck");

var db_mongo_api = require('./db_mongo_api')
var db_api = require('./db_api.js');
var app = require('../app')
var resolver = require('../resolver.js');
var resolver_api = require('../resolver_api.js');
var songkick_api = require('./songkick_api.js');

var network_utility = require('../utility/network_utility')

// var network_utility.fetchTry = require('../utility/network_utility').network_utility.fetchTry
var fetchTryAPI = require('../utility/network_utility').fetchTryAPI
var limiter = require('../utility/network_utility').limiter

var util = require('../util')
const wikipedia_api = require("./wikipedia_api");

// var sample_events = require('./example data objects/event').events;
// var sample_playlists_resolved =  require('./example endpoint outputs/playlists_resolved_20')
// var sample_getUserPlaylistFriends_resolved =  require('./example endpoint outputs/getUserPlaylistFriends_resolved_43')
// var sampleRelatedUsers = require('./example data objects/relatedUsers').relatedUsers

//========================================
//spotify api setup
//https://developer.spotify.com/documentation/general/guides/authorization-guide/

let all_scopes = ["playlist-read-private", "playlist-modify-private", "playlist-modify-public", "playlist-read-collaborative", "user-modify-playback-state", "user-read-currently-playing", "user-read-playback-state", "user-top-read", "user-read-recently-played", "app-remote-control", "streaming", "user-read-birthdate", "user-read-email", "user-read-private", "user-follow-read", "user-follow-modify", "user-library-modify", "user-library-read"];

//todo: thought about just making the spotifyAPI
var scopes = all_scopes,
	// redirectUri = 'http://localhost:8888/callback',
	redirectUri = 'http://localhost:3000/redirect',
	//redirectUri = 'https://master.d267e964bph18g.amplifyapp.com/redirect',
	//redirectUri = 'https://soundfound.io/redirect',
	//todo:
	state = 'some-state-of-my-choice';

//testing: app name: showcase
var client_id = '0e7ef13646c9410293a0119e652b35f7'; // Your client id
var client_secret = 'a00084c5c193478e9fc5d9a0c0e70058'; // Your secret

//testing: app name: showcase-2
// var client_id = '4afbf552a0aa45c798ff3ebc7743b729'; // Your client id
// var client_secret = 'b379617154884bfa8d6963a3fa5e0057'; // Your secret


var spotifyApi = {};

var credentials = {
	clientId: client_id,
	clientSecret: client_secret,
	// redirectUri:"cheat"
	redirectUri
};
//console.log("spotifyApi setup (no tokens)");
spotifyApi = new SpotifyWebApi(credentials);

module.exports.getSpotifyWebApi = function (clientOrigin) {
	return new Promise(function (done, fail) {
		//testing: not sure I even need this here? if your getting a spotify api,
		//aren't you out of the 'credentials caring about redirectUri' business? maybe keep just for consistency
		clientOrigin ? credentials.redirectUri = clientOrigin + "/redirect" : {};
		var s = new SpotifyWebApi(credentials);
		done(s)
	})
};

//todo: so refresh is cheating
//but other than that I can't tell the difference here

module.exports.getAuth = function (req, res) {
	console.log("getAuth...", req.body.code);

	//note: set clientOrigin as redirect so express doesn't care if I'm
	//hitting it from localhost or soundfound.io - it'll adjust Spotify's creds dynamically

	getTokens(req.body.code, req.headers.origin)
		.then(r => {
			///testing: safe to delete now right?
			//module.exports.spotifyApi = req.body.spotifyApi;

			//note: exact clone of what happens in middleware (which we didn't hit this one time)
			//just so that we can return the user info right away
			me.getSpotifyWebApi(req.headers.origin)
				.then(api => {

					//testing:
					api.setAccessToken(r.access_token);
					api.setRefreshToken(r.refresh_token);

					api.getMe()
						.then(data => {
							r.user = data.body
							db_mongo_api.fetchUser(r.user.id)
								.then(user => {
									//console.log("fetchUser",user);
									//console.log("spotify res",r);
									user !== undefined ? r.user = Object.assign(user, r.user) : {};
									//res.send({result:users[0]})
									res.send(r)
								}, e => {
									console.error("fetchUser", e);
								})
						}, e => {
							console.error("getMe", e);
						})
				}, e => {
					console.error("getSpotifyWebApi", e);
				})
		}, e => {
			console.error("token", e);
		})
}

module.exports.refreshAuth = function (req, res) {
	//console.log("getAuth...",req.body);
	console.log("refresing via client refresh_token...", req.body.access_token);
	var authOptions = {
		method: "POST",
		url: 'https://accounts.spotify.com/api/token',
		headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
		form: {
			grant_type: 'refresh_token',
			refresh_token: req.body.refresh_token
		},
		json: true
	};
	rp(authOptions).then(function (result) {
		console.log("new access_token from refresh", result.access_token);
		res.send({access_token: result.access_token})
	}).catch(function (err) {
		console.log(err.error);
		fail(err);
	})
}

// var global_access_token = "";
var getTokens = function (code, clientOrigin) {
	return new Promise(function (done, fail) {
		// var code = (new Buffer(client_id + ':' + client_secret).toString('base64'))
		// console.log({code});

		var authOptions = {
			method: "POST",
			url: 'https://accounts.spotify.com/api/token',
			headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
			form: {
				redirect_uri: clientOrigin ? clientOrigin + "/redirect" : redirectUri,
				grant_type: 'authorization_code',
				code: code
			},
			json: true
		};
		console.log(authOptions);

		rp(authOptions).then(function (res) {
			//	console.log("$res",res)
			done(res);
		}).catch(function (err) {
			console.log(err.error);
			fail(err);
		})
	})
}


// module.exports.setToken_implicit_Grant =  function(token){
// 	console.log("setToken",token);
// 	//console.log("setToken DISABLED");
// 	return new Promise(function(done, fail) {
// 		var credentials = {
// 			clientId: client_id,
// 			clientSecret: client_secret,
// 			// redirectUri:"cheat"
// 			redirectUri
// 		};
// 		//testing:
// 		spotifyApi = new SpotifyWebApi(credentials);
// 		console.log("new global_access_token from client",token);
//
//
// 		module.exports.spotifyApi = spotifyApi;
// 		spotifyApi.setAccessToken(token);
// 		me.token = token;
// 		done()
// 	})
// }

var global_refresh_franky = "AQBwJS5mnAtUzilNEQIrW6OdcyUODHY-BctGCO6n8bI4zqSZeX88uF68tDIz_MyauMo6HexVEfGkYLc2GZiBQosZ4oBuLltzGbFZ7D4PA8aUCseSnHUvrtKPyJxY0hSar5I"
var global_refresh_citizen = "AQA0tI-OosOKDuZjM2Im0UG5Zmd1rQOmS5XIS1pE1-uSP6EL1n49WhY3zAc0Z1stianFR_flIAoQpVs7VQk4zHbHza0TF5Iq9-8KCP8liPpbkmCCwrqYYJjx_prLJe9qi18"

var global_refresh_josh = "AQDCCKE5PpnL4R9xZ991j0d9MVijWGdhfX9qxvC2krMEcbuEWcf7aHRFHLVnAoPnPFneWCSISZCL3w7_NKrJcmHl3Y4zjfI3jknNezedI6IN5Nbv-Y1IqgdPwQ7k-dqZBd4"

//todo: expired!
// UPDATE: or not? accidently ran createPlaylistFromJson with his token and fetched from his library but maybe didn't create playlist for him
var global_refresh_dan = "AQA8qMva_Ccbqk1bN8RdpiT4fKgsgG2X7j1I_sM1B6ChylMZGaJkXfNTpml4Bg9HyYXwiUbTO7A8g1XjI_hdqn6FDUKhg55XFDzXouWLvBJDmx9IayQBX_j4KeLl79jbqHs"

//var global_refresh = global_refresh_dan
var global_refresh = global_refresh_franky

// var global_access_token = "";
var refresh = function () {
	return new Promise(function (done, fail) {
		//console.log("refresing token via global_refresh...");
		var authOptions = {
			method: "POST",
			url: 'https://accounts.spotify.com/api/token',
			headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
			form: {
				grant_type: 'refresh_token',
				refresh_token: global_refresh
			},
			json: true
		};
		rp(authOptions).then(function (res) {
			//console.log("new global_access_token from refresh",res.access_token);
			done(res.access_token);
		}).catch(function (err) {
			console.log(err.error);
			fail(err);
		})
	})
}


module.exports.getCheatyToken = function (redirectFromClient) {
	return new Promise(function (done, fail) {

		var credentials = {
			clientId: client_id,
			clientSecret: client_secret,
			// redirectUri:"cheat"
			redirectUri
		};
		//testing:
		redirectFromClient ? credentials.redirectUri = redirectFromClient : {};
		var spotifyApi = new SpotifyWebApi(credentials);
		refresh().then(token => {
			//console.log("setAccessToken:", token)
			//	token = "BQAnbI90_FpDKU2naDkWf6yWrrj6xqP_jVOpVh3eBiKHvqpLZV8QgfONXJZaKV-N2osZGnVzzIEPZYca4TrOVIj5Tjs9Rn5T-eICkE1vCjLI3OpJLYE5ex71He-zUmyZYMU8dZ9TFI80isQrGzqBcO-hyPv6qXYaTSujO35d8YIXEyzPIctBOw"
			spotifyApi.setAccessToken(token);
			done(spotifyApi)
		});
	})
}

//testing:
//doUserAuth()

//========================================
//Client Credential flow


var doAuth = function () {

	var credentials = {
		clientId: clientId,
		clientSecret: clientSecret,
	};

	spotifyApi = new SpotifyWebApi(credentials);

	// Retrieve an access token.
	spotifyApi.clientCredentialsGrant().then(
		function (data) {
			console.log('The access token expires in ' + data.body['expires_in']);
			console.log('The access token is ' + data.body['access_token']);

			// Save the access token so that it's used in future calls
			spotifyApi.setAccessToken(data.body['access_token']);
			module.exports.token = data.body['access_token']
		},
		function (err) {
			console.log('Something went wrong when retrieving an access token', err);
		}
	);
	// var token = "BQBWcWz_OUyjmnUyNt0iObiJRz7xxvjkdGRoGKizOyEiolvCcLVv1QU7d3iIeR6u0-QYtJaVOErUKOD9GD13NJTVss-TQ7F_o27xt0xENFCgBdSkmcKyzTvAxDWmrZvUox77oaC-yQL03aBV_-rOEifo5FvFzD3p9eUZzicbZUhVqkHUN3-p4CrTqAbs6oJO-v9hUCjseEc-3B1ZfkCm-VXUh43Ic1L9etZfU3tzg2wrlFyzC_oBbrRJ7Y1lQVrqYC_7rqpfb4neL3nlK4hz1oSctCg"
// spotifyApi.setAccessToken(token);
// module.exports.token = token;

}


//testing:
//doAuth()

// setInterval( e=>{
// 	console.log("client refresh @ 60m interval");
// 	doAuth()
// },3600*1000)

//=================================================
//utility
var me = module.exports;


/** Qualifying Report Object (QRP)
 *
 {
	artists: the original payload
	payload: the created payload for external resolution
	db: entries resolved by the db
	lastLook: <TODO> attempted to resolve on db but couldn't + had history of checking so we'll skip this
	resolved: final result for user
}
 * */


//todo: shouldn't really be exposing this like this...
me.getToken = function (req, res) {
	res.send(module.exports.token)
};


//user methods =================================================
//==============================================================






var getUserProfile = function (req, u) {
	//return new Promise(function(done, fail) {
	//	https://api.spotify.com/v1/users/{user_id}
	let uri = "https://api.spotify.com/v1/users/" + u.id;
	let options = {uri: uri, headers: {"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()}, json: true};
	return limiter.schedule(network_utility.fetchTry, options.uri, options)
		.then(function (r) {
			if (r === undefined) {
				debugger
			}
			return r;
		}, function (err) {
			debugger
			console.error('getUserProfile failed');
			console.error(err);
			throw err
		});
	//})
}

// me.refreshUserProfile = function (req,id){
// 	getUserProfile(req,{id:id})
// 		.then(r =>{
// 			//testing: 2nd arg is for faking only
// 			// db_mongo_api.refreshStaticUser(r,"123028477#2")
// 			db_mongo_api.refreshStaticUser(r)
// 				.then(r =>{
// 					console.log(r);
// 				})
// 		})
// }

//todo: to prevent un-needed spotify calls to refresh users
//should just have a TTL on an all_users repo that we can compare against
var refreshUserProfile = function (req, user) {
	//return new Promise(function(done, fail) {

	// let uri = "https://api.spotify.com/v1/users/"+ user.id;
	// let options = {uri:uri, headers: {"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()}, json: true};
	// return limiter.schedule(network_utility.fetchTry,options.uri,options)

	return getUserProfile(req, {id: user.id})
		.then(r => {
			if (!(r)) {
				debugger
			}
			user.images = r.images
			return r
		}, e => {
			throw(e)
		})
	//})
}

//testing: on network

// me.refreshUserProfile = function (req,id){
// 	getUserProfile(req,{id:id})
// 		.then(r =>{
// 			//testing: 2nd arg is for faking only
// 			// db_mongo_api.refreshStaticUser(r,"123028477#2")
// 			db_mongo_api.refreshStaticUser(r)
// 				.then(r =>{
// 					console.log(r);
// 				})
// 		})
// }

me.fetchSpotifyUsers = function (req, res) {
	db_mongo_api.fetchSpotifyUsers()
		.then(function (r) {
				res.send(r);
			},
			function (err) {
				console.error('getSpotifyUsers failed', err);
			});
}


//todo: remove self from users, collabUsers
//todo: turn into 'set' potentrial friends:
//having to churn thru playlists is expensive, so need to save potential friends
//to user's profile for retrieval after user init. would make sense to just combine this
//process with normal playlist processing albeit returning before the full playlist processing is done.

/** getUserPlaylistFriends
 *  @desc search thru all of a user's playlists for users that aren't Spotify {users}
 *  and also detect which ones are collaborations and return those users in {collabUsers}
 *
 * @param req.body.user.id
 * */

var getUserPlaylistFriends = function (req) {
	return new Promise(function (done, fail) {
		console.log("getUserPlaylistFriends...");
		//testing:
		//var user = 'tipshishat';
		//req.body.user = {id:'dacandyman01'};

		//testing: quick return
		//res.send({all_users:sample_getUserPlaylistFriends_resolved});return;


		req.body.spotifyApi.getUserPlaylists(req.body.user.id, {limit: 50})
			//this,req,key,skip,data
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(function (body) {

				//all owners of all my followed playlists
				var users = [];

				//user-playlist objects that I'm collaborating with
				var collabUserPlayObs = [];

				//todo: still don't quite understand something here
				//apparently having the g flag here was causing me to miss Kim somehow unless I exec on her
				//id before checking it again... idk confusing AF

				//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
				///JavaScript RegExp objects are stateful when they have the global or sticky flags set (e.g. /foo/g or /foo/y).
				// They store a lastIndex from the previous match...

				//var numericId = /^[0-9]*$/g;
				var numericId = /^[0-9]*$/;
				body.items.forEach(p => {

					p.owner.id !== req.body.user.id ? users.push(p.owner) : {};


					//todo: weird shit with Kim
					//for some reason I thought I needed to go resolve these profiles, not true so can ignore i guess...

					//p.owner.id == '1217637895' ? console.log(numericId.exec('1217637895')):{};
					//p.owner.id == '1240498738' ? console.log(numericId.exec('1240498738')):{};

					p.owner.id !== req.body.user.id ? users.push(p.owner) : {};
					p.collaborative ? collabUserPlayObs.push({owner: p.owner, id: p.id, name: p.name}) : {}
				});

				users = _.uniqBy(users, function (n) {
					return n.id;
				});
				collabUserPlayObs = _.uniqBy(collabUserPlayObs, function (n) {
					return n.owner.id;
				});


				//we're going to resolve playlists from my collaborative
				//todo: get playlist id? seems a little overkill for this purpose right?
				req.body.playlists = collabUserPlayObs.map(r => {
					return {id: r.id}
				});
				var collabMembers = [];


				console.log("resolving # of collaborative playlists", req.body.playlists.length);

				resolver.resolvePlaylists(req.body)
					.then(results => {
						results.forEach(r => {
							r.tracks.forEach(t => {
								collabMembers.push(t.added_by)
							})
						})
						collabMembers = _.uniqBy(collabMembers, function (n) {
							return n.id;
						});

						//gather up all id's as to not request the same profile 2x

						var collabMembersids = collabMembers.map(r => {
							return r.id
						});
						var collabUsersids = collabUserPlayObs.map(r => {
							return r.owner.id
						});
						var userids = users.map(r => {
							return r.id
						});
						var ids = collabMembersids.concat(collabUsersids);
						ids = ids.concat(userids)
						ids = _.uniq(ids);

						//console.log(ids);
						//testing:
						//ids = ids.slice(0,5)

						//todo: relocate limiter
						var limiterSpotify = new Bottleneck({
							maxConcurrent: 10,
							minTime: 100,
							trackDoneStatus: true
						});
						var profileProms = [];
						ids.forEach(i => {
							profileProms.push(limiterSpotify.schedule(getUserProfile, req, {id: i}, {}))
						})
						// ids.forEach(i =>{profileProms.push(getUserProfile(req,{id:i}))})

						//fetch all user profiles of all users from playlists

						Promise.all(profileProms)
							.then(presults => {
								//console.log(presults);
								// console.log("users",users.length);
								// console.log("collabUsers",collabUsers.length);
								// console.log("collabMembers",collabMembers.length);

								var collabMembersQualified = [];

								presults.forEach(pres => {
									users.forEach(u => {
										u.id === pres.id ? u.images = pres.images : {};
									})
									collabUserPlayObs.forEach(uob => {
										uob.owner.id === pres.id ? uob.owner.images = pres.images : {};
									})


									//note: non-fully qualified user objects (from track's added_by)
									collabMembers.forEach(u => {
										//u.id === pres.id ? u.images = pres.images:{};
										if (u.id === pres.id) {
											//we'll mark members from my collab playlists as such
											pres.member = true;
											collabMembersQualified.push(pres)
										}

									})
								})

								//collabUsers will include the playlist id/name that they matched to in my library
								var flatCollabUsers = collabUserPlayObs.map(i => {
									var r = i.owner;
									r.playlist_id = i.id;
									r.playlist_name = i.name;
									return r
								});

								//testing: trying to get 'real people' to the top
								//this obviously isn't going to fly for ANYONE that doesn't conform to:
								//FIRSTNAME<space>LASTNAME but idk
								var pat = /^\w+\s\w+$/
								users = users.sort((a, b) => {
									var ra = pat.exec(a.display_name);
									var rb = pat.exec(b.display_name)
									if (!ra && !rb) {
										return 0
									}
									;
									if (ra && !rb) {
										return -1
									}
									;
									if (!ra && rb) {
										return 1
									}
									;
								})
								var users_res = flatCollabUsers.concat(users);

								users_res = users_res.concat(collabMembersQualified)
								users_res = _.uniqBy(users_res, 'id')
								users_res = users_res.filter(i => {
									return !(i.id === req.body.user.id)
								})

								//note: attempt to fetch all users from created set
								//and mark the return users w/ isUser so UI knows whether they are clickable to add as friend

								var fetchProms = [];
								users_res.forEach(u => {
									fetchProms.push(db_mongo_api.fetchStaticUser(u))
								})
								Promise.all(fetchProms)
									.then(results => {

										results = results.filter(r => {
											return r !== null
										})

										var isUserSet = _.intersectionBy(results, users_res, 'id')

										users_res.forEach((u, i, arr) => {
											var isU = _.find(isUserSet, {id: u.id});
											isU ? arr[i].isUser = true : {};
										})
										done({all_users: users_res});

									}, e => {
										console.error(e);
										fail(this.name + " :" + e)
									})

							}, e => {
								fail(this.name + " :" + e)
							})

					}, e => {
						fail(this.name + " :" + e)
					})


			}, function (err) {
				console.error('getUserPlaylists failed:');
				console.error(err);
			});

	})
}

me.getUserPlaylistFriends = function (req, res) {
	getUserPlaylistFriends(req)
		.then(r => {
			res.send(r)
		})
		.catch(e => {
			res.status(500).send(e)
		})

}


/** getFollowedArtists
 * @desc
 * @param req
 * @param res
 */



var getFollowedArtists = function (req) {
	return new Promise(function (done, fail) {
		//console.log("getFollowedArtists",req.body.spotifyApi.getAccessToken());
		//comparing spotifyApi here to sucessful one in resolvePlaylists
		// console.log("getFollowedArtists... is forbidden? spotifyApi:",spotifyApi);
		// this.name = "getFollowedArtists";
		//fully qualified artist objects include genres
		//todo: not sure on limit of this yet
		//https://developer.spotify.com/documentation/web-api/reference/follow/get-followed/

		var pages = [];
		req.body.spotifyApi.getFollowedArtists({limit: 50})
			.then(function (data) {
				//some results from spotify that are asking for specific types of items
				//have a different response format with +1 levels named after that type
				//got into this situation after trying to reuse my promise functions related to paging
				data.body.items = data.body.artists.items;
				data.body.next = data.body.artists.next;
				data.body.total = data.body.artists.total;
				return data;

				//bind: first value is what 'this' gets set to in function being bound to
				//the rest are just other arguments which will PRECEDE the normal return value
				//note: AS IN THE NORMAL VALUE RETURNED BY THE PROMISE WILL ALWAYS BE THE LAASSSTTTT
				//in the params list of the binded function
				//for the bound function in the function's param list
				//hence it network_utility.pageIt doesn't not use this, has a key value and then takes the data
				//passed via promise chaining as its last arg

			})
			.then(network_utility.pageItAfter.bind(null, 'artist', pages, req))
			.then(r => {
				resolver.resolveArtistsCachedGenres(r.items, 'saved')
				done({artists: r.items, stats: null});

			})
			.catch(err => {
				//console.error("getFollowedArtists this just prints on start i guess?",err);
				console.error("getFollowedArtists: " + err);
				fail(err)
				//next(e.body)
			})
	})
}
me._getFollowedArtists = getFollowedArtists;

me.getFollowedArtists = function (req, res) {
	getFollowedArtists(req)
		.then(r => {
			let array = [];
			r.artists.forEach(a =>{
				array.push(a.name)
			})
			debugger
			res.send({name_array:array,result:r})
		})
		.catch(e => {
			res.status(500).send(e)
		})

}


//todo: regarding getMySavedTracks and getMySavedAlbums
//#1 interestingly...
//when I pass artistsPay to commit + checkDB, because of how I setup the albumOb.body.items,
//I'm actually passing a reference to this original albumOb to be checked
//so albumOb.items come back fully qualified b/c they were qualified in place by reference

//todo: regarding getMySavedAlbums,getTopArtists, getMySavedTracks
//not doing anything with 'couldn't find artists' printout

//todo: duplicate code b/c not sure how to handle 'branching promises'
//todo: update with
me.getMySavedTracksLast = function (req, res) {
	var trackOb = {};
	req.body.spotifyApi.getMySavedTracks({limit: 5})
		.then(pagedRes => {
			trackOb = pagedRes.body;
			var artists = [];
			trackOb.items.forEach(item => {
				artists = artists.concat(_.get(item, 'track.artists'));
			})

			//prune duplicate artists from track aggregation
			artists = _.uniqBy(artists, function (n) {
				return n.id;
			});

			//resolving all the artists for all the tracks
			return resolver.resolveArtists(req, artists)
				.then(empty => {
					var pullArtists = [];
					trackOb.items.forEach(item => {
						delete item.track.album.artists;

						//I just don't like looking at these
						item.track.available_markets = null;
						item.track.album.available_markets = null;

						item.track.artists.forEach(a => {
							pullArtists.push(a)
						})
					});

					return db_api.checkDBForArtistGenres({payload: pullArtists}, 'payload')
						.then(resolvedArtists => {
							return trackOb.items.map(i => {
								var t = {...i.track}
								t.added_at = i.added_at;
								return t;
							})
						})
				})
		})
		.then(r => {
			res.send(r);
		}, function (err) {
			console.log('getMySavedTracks failed', err);
		});
};

//todo: what stats did I think I wanted out of artists?
//added_at sorting and artistFreq doesn't make any sense :p

// var artists_stats_producer= function(arr,key,source){
//
// 	var stats = {};
// 	var artistFreq = {};
// 	arr.forEach(a =>{
// 		!(artistFreq[a.id]) ? artistFreq[a.id] = {value:1,artist:a}: artistFreq[a.id].value++;
// 	})
//
// 	var artObs = [];
// 	Object.keys(artistFreq).forEach(key =>{artObs.push(artistFreq[key])})
// 	artObs= _.orderBy(artObs, function (r) {return r.value},'desc');
// 	//var sorted= _.orderBy(arr, function (r) {return new Date(r.added_at)},'desc');
// 	//console.log(sorted);
// 	//stats.recent = sorted.slice(0,3)
// 	stats.artists_top = artObs.slice(0,3)
// 	return {[key + "s"]:arr,stats:stats};
// }


var reducer_familyAgg_stats_producer = function (arr, key, source) {


	var stats = {recent: [], artists_top: []};
	var artistFreq = {};
	var records = arr.map(i => {
		var t = {...i[key]}
		t.added_at = i.added_at;
		t.source = source
		return t;
	})

	records.forEach(t => {
		t.artists.forEach(a => {
			// if(a.id === "4pejUc4iciQfgdX6OKulQn"){
			// 	debugger;
			// }
			a.familyAgg = util.familyFreq(a);
			!(artistFreq[a.id]) ? artistFreq[a.id] = {value: 1, artist: a} : artistFreq[a.id].value++;

		})

	})

	var artObs = [];
	Object.keys(artistFreq).forEach(key => {
		artObs.push(artistFreq[key])
	})

	artObs = _.orderBy(artObs, function (r) {
		return r.value
	}, 'desc');
	var sorted = _.orderBy(records, function (r) {
		return new Date(r.added_at)
	}, 'desc');

	stats.recent = sorted.slice(0, 5)
	stats.artists_top = artObs.slice(0, 5)

	return {[key + "s"]: records, stats: stats};
}


//testing: literally just copied and pasted getMySavedTracks
var getMyTopTracks = function (req, shallowTracks) {
	return new Promise(function (done, fail) {
		var trackOb = {};

		//console.warn("getMyTopTracks is skipping network_utility.pageIt!");
		//!(shallowTracks) ? shallowTracks = 'skip':{};

		req.body.spotifyApi.getMyTopTracks({limit: 50})
			.then(network_utility.pageIt.bind(null, req, null, shallowTracks))
			.then(pagedRes => {

				//note: if shallowTracks, ignore pagedRes (which will have hit USER's tracks library)
				if (shallowTracks && shallowTracks !== 'skip') {
					//testing: yeah... just put it in the spotify console format
					//instead of fucking with a bunch of branching logic
					trackOb = {
						items: shallowTracks.map(r => {
							return {track: r}
						})
					}
				} else {
					trackOb = pagedRes
				}

				var artists = [];
				trackOb.items.forEach(item => {
					artists = artists.concat(_.get(item, 'track.artists'));
				})

				//prune duplicate artists from track aggregation
				artists = _.uniqBy(artists, function (n) {
					return n.id;
				});

				//resolving all the artists for all the tracks
				return resolver.resolveArtists2(req, artists)
					.then(resolved => {

						var pullArtists = [];
						var artistMap = {};
						resolved.forEach(a => {
							artistMap[a.id] = a
						})

						trackOb.items.forEach(item => {

							//note: theres an artist listing on both: items[0].track.album.artists AND a items[0].track.artists
							//the difference between the album's artist(s) and a track's artist(s)
							//well remove the album one for now
							item.track.album ? delete item.track.album.artists : {}

							//I just don't like looking at these
							item.track.available_markets = null;
							item.track.album ? item.track.album.available_markets = null : {}

							//console.log(item);
							item.track.artists.forEach((a, i, arr) => {
								//note: think maybe artistMap[a.id].genres get's destroyed somehow after being accessed first time?

								//todo: super weird Santana issue?
								if (!(artistMap[a.id])) {
									console.log("artistMap missed", a.id);
								}
								if (artistMap[a.id]) {
									arr[i] = JSON.parse(JSON.stringify(artistMap[a.id]));
									resolver.resolveArtistsCachedGenres([arr[i]], 'saved')
								}

								// if(arr[i].id === "4pejUc4iciQfgdX6OKulQn"){
								// 	debugger;
								// }

							})
						})


						//testing: disabled, replaced with static genres assignment
						return reducer_familyAgg_stats_producer(trackOb.items, 'track', 'saved')

						// return db_api.checkDBForArtistGenres({payload:pullArtists},'payload')
						// 	.then(resolvedArtists =>{
						// 		//todo: this all looks like shit (could be faster?)
						// 		return reducer_familyAgg_stats_producer(trackOb.items,'track','saved')
						// 	})
					})
			})
			.then(r => {

				done(r)
			}, function (err) {
				console.log('getMySavedTracks failed', err);
				fail(err)
			});
	})
}

/** getMySavedTracks
 * @desc Get tracks in the signed in user's Your Music library
 * @param req
 * @param res
 */

me.getMySavedTracks = function (req, res) {

	getMySavedTracks(req)
		.then(r => {
			res.send(r)
		})
		.catch(e => {
			res.status(500).send(e)
		})

};

var getMySavedTracks = function (req, shallowTracks) {
	return new Promise(function (done, fail) {
		var trackOb = {};

		//testing: skip paging
		//console.warn("getMySavedTracks is skipping network_utility.pageIt!");
		//!(shallowTracks) ? shallowTracks = 'skip' : {};

		req.body.spotifyApi.getMySavedTracks({limit: 50})
			.then(network_utility.pageIt.bind(null, req, null, shallowTracks))
			.then(pagedRes => {


				//note: if shallowTracks, ignore pagedRes (which will have hit USER's tracks library)
				if (shallowTracks && shallowTracks !== 'skip') {
					//testing: yeah... just put it in the spotify console format
					//instead of fucking with a bunch of branching logic
					trackOb = {
						items: shallowTracks.map(r => {
							return {track: r}
						})
					}
				} else {
					trackOb = pagedRes
				}

				var artists = [];
				trackOb.items.forEach(item => {
					artists = artists.concat(_.get(item, 'track.artists'));
				})

				//prune duplicate artists from track aggregation
				artists = _.uniqBy(artists, function (n) {
					return n.id;
				});


				//resolving all the artists for all the tracks

				return resolver.resolveArtists2(req, artists)
					.then(resolved => {

						var pullArtists = [];
						var artistMap = {};
						resolved.forEach(a => {
							artistMap[a.id] = a
						})

						trackOb.items.forEach(item => {

							//note: theres an artist listing on both: items[0].track.album.artists AND a items[0].track.artists
							//the difference between the album's artist(s) and a track's artist(s)
							//well remove the album one for now
							item.track.album ? delete item.track.album.artists : {}

							//I just don't like looking at these
							item.track.available_markets = null;
							item.track.album ? item.track.album.available_markets = null : {}

							//console.log(item);
							item.track.artists.forEach((a, i, arr) => {

								//note: think maybe artistMap[a.id].genres get's destroyed somehow after being accessed first time?

								//todo: super weird Santana issue?
								if (!(artistMap[a.id])) {
									console.log("artistMap missed", a.id);
								}
								if (artistMap[a.id]) {
									arr[i] = JSON.parse(JSON.stringify(artistMap[a.id]));
									resolver.resolveArtistsCachedGenres([arr[i]], 'saved')
								}

								// if(arr[i].id === "4pejUc4iciQfgdX6OKulQn"){
								// 	debugger;
								// }

							})
						})

						//testing: disabled, replaced with static genres assignment
						return reducer_familyAgg_stats_producer(trackOb.items, 'track', 'saved')

						// return db_api.checkDBForArtistGenres({payload:pullArtists},'payload')
						// 	.then(resolvedArtists =>{
						// 		//todo: this all looks like shit (could be faster?)
						// 		return reducer_familyAgg_stats_producer(trackOb.items,'track','saved')
						// 	})
					})
			})
			.then(r => {

				done(r)
			}, function (err) {
				console.log('getMySavedTracks failed', err);
				fail(err)
			});
	})
}

me._getMySavedTracks = getMySavedTracks

me.getMySavedTracksArtists = function (req, res) {

	getMySavedTracksArtists(req)
		.then(r => {
			res.send(r)
		})
		.catch(e => {
			res.status(500).send(e)
		})

};

var getMySavedTracksArtists = function (req, ) {
	return new Promise(async function (done, fail) {
		let r =  await me._getMySavedTracks(req)
		let artists = [];
		let artistsTotal = 0;
		r.tracks.forEach(t =>{
			t.artists.forEach(a =>{

				artistsTotal++
				let dupe = artists.find(aFind => a.id ===aFind.id)
				if(dupe===undefined){
					// artists.push({id:a.id,name:a.name,familyAgg:a.familyAgg,genres:a.genres})
					artists.push(a)
				}
			})
		})
		done(artists)
	})
}
me._getMySavedTracksArtists = getMySavedTracksArtists

var getRecentlyPlayedTracks = function (req) {
	return new Promise(function (done, fail) {
		//var trackOb = {};
		//note: always a max of 50 tracks

		var task = function () {
			let options = {
				uri: "https://api.spotify.com/v1/me/top/tracks",
				headers: {"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()}, json: true
			};
			return limiter.schedule(network_utility.fetchTry, options.uri, options)
			//return limiter.schedule(rp,{uri:"https://api.spotify.com/v1/me/top/tracks"})
			//return limiter.schedule(req.body.spotifyApi.getMyRecentlyPlayedTracks({limit : 50}))
		}
		task()
			.then(result => {

				var artists = [];
				result.items.forEach(item => {

					artists = artists.concat(_.get(item, 'artists'));
				})

				//testing: load
				// for(var x = 0; x<10;x++){
				// 	artists = artists.concat(artists);
				// }

				//prune duplicate artists from track aggregation
				//testing: load
				artists = _.uniqBy(artists, function (n) {
					return n.id;
				});
				//console.log(artists);

				//resolving all the artists for all the tracks in place
				return resolver.resolveArtists2(req, artists)
					.then(resolved => {

						var artistMap = {};
						resolved.forEach(a => {
							artistMap[a.id] = a
						})
						result.items.forEach(item => {

							item.album ? delete item.album.artists : {}
							item.available_markets = null;
							item.album ? item.album.available_markets = null : {}

							item.artists.forEach((a, i, arr) => {
								//note: think maybe artistMap[a.id].genres get's destroyed somehow after being accessed first time?

								//todo: super weird Santana issue?
								if (!(artistMap[a.id])) {
									console.log("artistMap missed", a.id);
								}
								if (artistMap[a.id]) {
									arr[i] = JSON.parse(JSON.stringify(artistMap[a.id]));
									resolver.resolveArtistsCachedGenres([arr[i]], 'saved')
								}

								// if(arr[i].id === "4pejUc4iciQfgdX6OKulQn"){
								// 	debugger;
								// }

							})
						});

						//todo: eh idk why I thought it was so important to produce these stats back here anyways...?
						done({tracks: result.items, stats: null})
						//return reducer_familyAgg_stats_producer(result.items,'track','recent')

						//testing:
						//possible if you just keep playing the same song lol
						//result.body.items = _.uniqBy(result.body.items, function(n) {return n.track.id;});

					})
			})
			.then(r => {
				done(r);
			}, function (err) {
				debugger
				console.error('getRecentlyPlayedTracks failed', err);
			});
	})
}

/** getMySavedAlbums
 *
 * @param req
 * @param res
 */
var getMySavedAlbums = function (req, shallowAlbums) {
	return new Promise(function (done, fail) {
		var albumOb = {};
		console.log("getMySavedAlbums");
		req.body.spotifyApi.getMySavedAlbums({limit: 50})
			//testing: skip paging
			//!(shallowAlbums) ? shallowAlbums = 'skip':{};

			//this,req,key,skip,data
			//if skip is non-null (an array of partial albums),then network_utility.pageIt will short-circuit
			.then(network_utility.pageIt.bind(null, req, null, shallowAlbums))
			.then(pagedRes => {

				if (shallowAlbums) {
					//testing: yeah... just put it in the spotify console format
					//instead of fucking with a bunch of branching logic
					albumOb = {
						items: shallowAlbums.map(r => {
							return {album: r}
						})
					}
				} else {
					albumOb = pagedRes
				}


				var artists = [];
				albumOb.items.forEach(item => {
					artists = artists.concat(_.get(item, 'album.artists'));
				})

				//prune duplicate artists from track aggregation
				artists = _.uniqBy(artists, function (n) {
					return n.id;
				});

				return resolver.resolveArtists2(req, artists)
					.then(resolved => {
						var artistsPay = [];

						var artistMap = {};
						resolved.forEach(a => {
							artistMap[a.id] = a
						})

						albumOb.items.forEach(item => {
							//note: theres a genres listing on both: items[0].album.genres AND a items[0].album.artists.genres
							//(the one I'm finding myself) versus the genres of an album itself
							//removing the latter for now
							delete item.album.genres;

							//I just don't like looking at this
							item.album.available_markets = null;

							var findMatch = function (ar, id) {
								var ret = false;
								ar.forEach(a => {
									a.id === id ? ret = true : {};
								})
								return ret;
							};
							item.album.artists.forEach((a, i, arr) => {
								arr[i] = JSON.parse(JSON.stringify(artistMap[a.id]));
								resolver.resolveArtistsCachedGenres([arr[i]], 'saved')
							})

							//var resolvedAlbumArtists = resolved.filter(a =>{return findMatch(item.album.artists,a.id)})
							//item.album.artists = resolvedAlbumArtists;

							//these have genres on them, still a bit of a waste tho
							//artistsPay = artistsPay.concat(item.album.artists);
						});

						return reducer_familyAgg_stats_producer(albumOb.items, 'album', 'saved')

						//prune duplicate artists from track aggregation
						//artistsPay = _.uniqBy(artistsPay, function(n) {return n.id;});

						// return db_api.checkDBForArtistGenres({payload:artistsPay},'payload')
						// 	.then(resolvedArtists =>{
						//
						// 		return reducer_familyAgg_stats_producer(albumOb.items,'album','saved')
						//
						// 	})

					}).catch(err => {
						debugger
						console.log(err);
						fail(err)
					});
			})
			.then(r => {
				done(r);
			}, function (err) {
				fail(err)
			})
			.catch(err => {
				debugger
				console.log(err);
				fail(err)
			});
	})
}

me.getMySavedAlbums = function (req, res) {

	getMySavedAlbums(req)
		.then(r => {
			res.send(r)
		})
		.catch(e => {
			res.status(500).send(e)
		})

};


/**
 * getTopArtists
 *
 * @param req.range = one of these enums:
 *
 * long_term (calculated from several years of data and including all new data as it becomes available)
 medium_term (approximately last 6 months)
 short_term (approximately last 4 weeks)

 https://developer.spotify.com/documentation/web-api/reference/personalization/get-users-top-artists-and-tracks/
 */

//note: manual API (spotify-web-api-node's getTop doesn't seem like it specifies terms on return
//note: no limiter b/c it's only 3 calls

	//todo: when testin BRAND new user w/ no listening history, could have sworn I produced undefined errors here...
var getTopArtists = function (req) {
		return new Promise(function (done, fail) {

			//thought about paraming but why not just get it all?
			//fetch all versions of this, break apart and then qualify

			var ops = [];
			var ranges = ["long_term", "medium_term", "short_term"];
			//var ranges = ["long_term","medium_term"];
			ranges.forEach(r => {
				let uri = "https://api.spotify.com/v1/me/top/artists?limit=50&offset=0&time_range=" + r;
				let options = {
					uri: uri,
					headers: {"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()},
					json: true
				};
				//console.log(options.uri);
				ops.push(options)
			});
			var task = function (options) {
				return limiter.schedule(rp, options)
					//return limiter.schedule(rp,options)
					.then(function (response) {
						//console.log(response.artists.href);
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
			var ps = ops.map(task);
			//this comes with genres just not MY qualified ones
			//so usual process of committing in order to get qualified genres back
			Promise.all(ps).then(r => {

				var artists = [];
				var termMap = {};
				var resolvedMap = {long: [], medium: [], short: []};

				//console.log("termProms",r);
				r.forEach((tres, i) => {
					if (!tres) {
						console.log(r);
						debugger
					}

					artists = artists.concat(tres.items);
					//recall order of promise returns IS guaranteed
					//gotta do this mapping somehow...
					switch (i) {
						//was about to assign this just on the object itself but sql :(
						// case 0:{tres.items.forEach((r,i,arr) =>{arr[i].term = 'long'});break;}
						// case 1:{tres.items.forEach((r,i,arr) =>{arr[i].term = 'medium'});break;}
						// case 2:{tres.items.forEach((r,i,arr) =>{arr[i].term = 'short'});break;}
						case 0: {
							tres.items.forEach(i => {
								termMap[i.id] = 'long'
							});
							break;
						}
						case 1: {
							tres.items.forEach(i => {
								termMap[i.id] = 'medium'
							});
							break;
						}
						case 2: {
							tres.items.forEach(i => {
								termMap[i.id] = 'short'
							});
							break;
						}
					}
				})


				artists = _.uniqBy(artists, function (n) {
					return n.id;
				});
				resolver.resolveArtistsCachedGenres(artists, 'top')

				artists.forEach((a, i, arr) => {
					termMap[a.id] ? arr[i].term = termMap[a.id] : {};
				});

				//testing: sample distribution (Josh)
				//{"short": 24, "medium": 33, "long": 22}
				//var count = {short:0,medium:0,long:0}
				//artists.forEach((a,i,arr)=>{count[a.term ]++});

				done(artists);

				//testing: forgot to switch this over to cachedGenres

				// .then(justGetFromDb =>{
				// 	db_api.checkDBForArtistGenres({artists:artists},'artists')
				// 		.then(result =>{
				// 			if(result.db.length !== result.artists.length){
				// 				console.log("couldn't find " + result.payload.length + " artists");
				// 			}
				// 			result.resolved = result.db.concat(result.payload);
				// 			//console.log(result.resolved.length);
				//
				// 			//map the term value for the artist back onto itself according to the map
				// 			//also add familyAgg
				// 			result.resolved.forEach((a,i,arr)=>{
				// 				// termMap[a.id] ? resolvedMap[termMap[a.id]].push(a):{};
				// 				termMap[a.id] ? arr[i].term = termMap[a.id]:{};
				// 				a.source = 'top'
				// 				util.familyFreq(a)
				// 			});
				//
				// 			done(result.resolved)
				// 			//res.send(resolvedMap)
				// 		})
				// },err =>{fail(err)})
			}, err => {
				debugger
				console.error("getTopArtists mystery error?", err);
				fail(err)
			})
		})
	}

me.getTopArtists = function (req, res) {

	getTopArtists(req)
		.then(r => {
			res.send(r)
		})
		.catch(e => {
			res.status(500).send(e)
		})

};


//static user methods =================================================
//=====================================================================


//todo: api will timeout if it has to do any resolves :(


//todo: so why again am I NOT storing the genres on the shallow artists?
//the idea was just to store these references to various collections at a static user
//so ONLY as to save time from having to pull all their data down every time they log in

me.fetchStaticUser = function (req, res) {

	async function asyncBatchFetch() {
		try {
			console.log("fetchStaticUser", (({id, display_name}) => ({id, display_name}))(req.body.friend));
			let userResult = await db_mongo_api.fetchStaticUser(req.body.friend)
			var refreshes = []
			var currentUser = await req.body.spotifyApi.getMe()
			var selfFetch = currentUser.body.id === req.body.friend.id

			var shallow = true;
			if (userResult === null) {
				//note:Object Destructuring and Property Shorthand to get object w/ reduced set of properties
				console.log("fetchStaticUser will initialize new user:",
					(({id, display_name}) => ({id, display_name}))(req.body.friend));
				shallow = false;
				userResult = req.body.friend

			} else {
				if (selfFetch) {
					var task = function (u) {
						return refreshUserProfile(this, u)
					}

					//testing: load
					// for(var x = 0; x< 10; x++){
					// 	userResult.related_users = userResult.related_users.concat(userResult.related_users)
					// }

					//note:refreshUserProfile will replaces images in place
					refreshes = userResult.related_users.map(task.bind(req))
					//console.log("profile refreshi:",refreshes.length);
				}
			}

			//note: empty if we're initing new user
			var updated = await Promise.all(refreshes);
			updated.forEach((u, i, arr) => {
				userResult.related_users.forEach(ru => {
					if (u.id === ru.id) {
						arr[i].images = u.images
					}
				})
			})
			refreshes.length > 0 ? console.log("refreshed userResult.related_users") : {};


			//testing: this is slow as shit
			var getInfos = false;
			//var getInfos = currentUser.body.id === req.body.friend.id;

			let resolvedArtists = null;
			if (shallow) {

				//todo: when we're shallow, we still have source info. resolveArtists2 doesn't care about that
				//so we'll preserve them here and re-apply? keeps resolveArtists2 from becoming to complicated but still...?
				var sourceMap = {};

				userResult.artists.artists.forEach(a => {
					if (!(sourceMap[a.id])) {
						sourceMap[a.id] = a.source
					} else {
						sourceMap[a.id] = 'both'
					}
				})

				resolvedArtists = await resolver.resolveArtists2(req, userResult.artists.artists)

				var sourcedTop = {}
				resolvedArtists.forEach(ra => {
					if (!(sourceMap[ra.id] === 'both')) {
						ra.source = sourceMap[ra.id]
					} else {
						if (!(sourcedTop[ra.id])) {
							sourcedTop[ra.id] = 'sourced'
							ra.source = 'top'
						} else {
							ra.source = 'saved'
						}
					}
				})

				//note: in the same logic as above - these could (will) be mixed 'saved'/'top' when shallow
				//so resolveArtistsCachedGenres was modified to only force 'saved' here if there isn't already one there
				resolver.resolveArtistsCachedGenres(resolvedArtists, 'saved')

				if (getInfos) {
					var task2 = async function (pay) {
						return await me.getArtistInfo(req, pay)
					}
					var ps2 = resolvedArtists.map(task2)
					var iResults = await Promise.all(ps2)

					resolvedArtists.forEach((a, i, arr) => {
						var info = _.find(iResults, function (r) {
							return r.id === a.id
						});
						arr[i] = {...arr[i], ...info}
					})

				}


				userResult.artists.artists = resolvedArtists;
				//todo: make shallow?
			} else {
				var artistOb = await getFollowedArtists(req)
				resolvedArtists = await resolver.resolveArtists2(req, artistOb.artists)
				resolvedArtists = resolver.resolveArtistsCachedGenres(resolvedArtists, 'saved')
			}

			console.log("resolvedArtists", resolvedArtists.length);

			var resolvedTopArtists = [];
			if (selfFetch) {
				resolvedTopArtists = await getTopArtists(req)
				console.log("resolvedTopArtists", resolvedTopArtists.length);

				if (getInfos) {
					var task2 = async function (pay) {
						return await me.getArtistInfo(req, pay)
					}
					var ps2 = resolvedTopArtists.map(task2)
					var iResults = await Promise.all(ps2)

					resolvedTopArtists.forEach((a, i, arr) => {
						var info = _.find(iResults, function (r) {
							return r.id === a.id
						});
						arr[i] = {...arr[i], ...info}
					})
				}

			} else {
				console.warn("getTopArtists skipped")
			}


			//todo: this has it's own mechanism for mutating albums w/ artist genres
			//should replace with	resolver.resolveArtistsCachedGenres

			const resolvedAlbumsStatsOb = await getMySavedAlbums(req, shallow ? userResult.albums.albums : null)
			console.log("resolvedAlbums", resolvedAlbumsStatsOb.albums.length);


			//testing: disabling for now
			//let resolveTracksStatsOb = {tracks:[],stats:null}

			let resolveTracksStatsOb = await getMySavedTracks(req, shallow ? userResult.tracks.tracks : null)
			console.log("resolvedTracks", resolveTracksStatsOb.tracks.length)


			//testing: payload size issues
			console.warn("reducing resolveTracksStatsOb.tracks.length", resolveTracksStatsOb.tracks.length)
			resolveTracksStatsOb.tracks = resolveTracksStatsOb.tracks.slice(0, 2500)

			let resolveRecentTracksOb = {tracks: []}
			if (selfFetch) {
				resolveRecentTracksOb = await getRecentlyPlayedTracks(req)
				console.log("resolvedTracks", resolveRecentTracksOb.tracks.length)
			} else {
				console.warn("getRecentlyPlayedTracks skipped")
			}


			//testing:disabled (enabled = 500 on server, but not locally?)
			//resolvedTracks.tracks = [];

			//todo: codify defs for 'shallow' artist, album,track


			//todo: somehow wasn't including genres:r.genres??
			const getShallowArtist = (r) => {
				return {
					id: r.id,
					name: r.name,
					type: "artist",
					source: r.source,
					images: r.images,
					genres: r.genres,
					familyAgg: r.familyAgg,
					release_range: r.release_range,
					followers: r.followers,
					popularity: r.popularity,
					onTourUntil: r.onTourUntil
				}
			}

			const getShallowArtists = (r) => {
				var arts = _.get(r, 'artists')
				return arts.map(getShallowArtist)
			}
			const getShallowAlbum = (r) => {
				return {id: r.id, name: r.name, images: r.images, type: "album"}
			}

			//testing: payload looks the same either way
			var payload = JSON.parse(JSON.stringify(userResult))
			payload = {
				...payload, artists: {artists: resolvedArtists.concat(resolvedTopArtists), stats: null},
				tracks: resolveTracksStatsOb, albums: resolvedAlbumsStatsOb
			}

			payload.artists.artists = payload.artists.artists.map(getShallowArtist)

			// r=>{
			// return {id:r.id,name:r.name,source:r.source,
			// 	images:r.images,type:r.type,genres:r.genres,familyAgg:r.familyAgg}})
			payload.albums.albums = payload.albums.albums.map(r => {
				return {id: r.id, name: r.name, artists: getShallowArtists(r), images: r.images, type: r.type}
			})

			//todo: just ignoring resolveRecentTracksOb.stats for now
			payload.tracks.tracks = payload.tracks.tracks.concat(resolveRecentTracksOb.tracks);
			payload.tracks.tracks.map(r => {
				return {
					id: r.id,
					name: r.name,
					artists: getShallowArtists(r),
					album: getShallowAlbum(r.album),
					type: r.type
				}
			})

			//todo: async if statement w/out modifying return value in called function
			//note: storeStaticUserLocal also appends related_users

			var moddedPayload = await me.storeStaticUserLocal(req, shallow ? null : payload)

			if (moddedPayload) {
				payload = moddedPayload
			}


			//todo: we never store 'top artists' b/c they are dynamic
			//so remember to add them in here to response

			//todo: same with recentTracks

			//testing: playing around with compression to get around lambda response size limit (6mb)
			//https://jun711.github.io/aws/handling-aws-api-gateway-and-lambda-413-error/

			// var JSONC = require('jsoncomp')
			//full payload was taking ?? awhile
			// var userResultC = JSONC.compress(userResult)
			// var userResultC = JSONC.compress(userResult.albums.albums)

			const size = Buffer.byteLength(JSON.stringify(payload))
			const mb = size / 1024 / 1024
			console.log("userResult size", mb);
			return payload

		} catch (e) {
			debugger
			var err = e.error ? e.error : e;
			var msg = "asyncBatchFetch failed"
			console.error(msg, err);
			throw {msg: msg, error: err}
		}
	}

	asyncBatchFetch()
		.then(r => {
			res.send(r)
		}, e => {
			res.status(500).send(e)
		})
};


/**
 * storeStaticUser
 * @desc calls following stubs and stores result in mongo
 * - getTopArtists,getFollowedArtists
 * - getUserPlaylistFriends
 * */


me.storeStaticUserLocal = function (req, payload) {
	return new Promise(function (done, fail) {
		//todo: see where called
		if (!(payload)) {
			done(false)
		} else {
			//note: your related users are just your playlist buddies
			req.body.user = {id: req.body.friend.id}
			getUserPlaylistFriends(req).then(rel => {
				payload.related_users = rel.all_users

				//testing: adding some users manually
				//if(req.body.friend.id !== '123028477'){
				// 	var d = {
				// 		"friend":true,
				// 		"FLAG":"EXAMPLE ADDED",
				// 		"display_name" : "Daniel Niemiec",
				// 		"external_urls" : {
				// 			"spotify" : "https://open.spotify.com/user/123028477"
				// 		},
				// 		"href" : "https://api.spotify.com/v1/users/123028477",
				// 		"id" : "123028477",
				// 		"type" : "user",
				// 		"uri" : "spotify:user:123028477",
				// 		"images" : [
				// 			{
				// 				"height" : null,
				// 				"url" : "https://scontent-ort2-2.xx.fbcdn.net/v/t1.18169-1/p320x320/15094378_10154116279302749_8365848785354290791_n.jpg?_nc_cat=103&ccb=1-3&_nc_sid=0c64ff&_nc_ohc=RXtfnwEPYfgAX98Y7wt&_nc_ht=scontent-ort2-2.xx&tp=6&oh=df6539e97331192f11e369d16ad9945f&oe=60E0C2BD",
				// 				"width" : null
				// 			}
				// 		]
				// 	}
				// 	payload.related_users.push(d)
				// }
				// if(req.body.friend.id !== '123028477#2'){
				// 	var d = {
				// 		"friend":true,
				// 		"FLAG":"EXAMPLE ADDED",
				// 		"display_name" : "Daniel Niemiec#2",
				// 		"external_urls" : {
				// 			"spotify" : "https://open.spotify.com/user/123028477"
				// 		},
				// 		"href" : "https://api.spotify.com/v1/users/123028477",
				// 		"id" : "123028477#2",
				// 		"type" : "user",
				// 		"uri" : "spotify:user:123028477",
				// 		"images" : [
				// 			{
				// 				"height" : null,
				// 				"url" : "https://scontent-ort2-2.xx.fbcdn.net/v/t1.18169-1/p320x320/15094378_10154116279302749_8365848785354290791_n.jpg?_nc_cat=103&ccb=1-3&_nc_sid=0c64ff&_nc_ohc=RXtfnwEPYfgAX98Y7wt&_nc_ht=scontent-ort2-2.xx&tp=6&oh=df6539e97331192f11e369d16ad9945f&oe=60E0C2BD",
				// 				"width" : null
				// 			}
				// 		]
				// 	}
				// 	payload.related_users.push(d)
				// }
				// if(req.body.friend.id !== '123028477#3'){
				// 	var d = {
				// 		"friend":true,
				// 		"FLAG":"EXAMPLE ADDED",
				// 		"display_name" : "Daniel Niemiec#3",
				// 		"external_urls" : {
				// 			"spotify" : "https://open.spotify.com/user/123028477"
				// 		},
				// 		"href" : "https://api.spotify.com/v1/users/123028477",
				// 		"id" : "123028477#3",
				// 		"type" : "user",
				// 		"uri" : "spotify:user:123028477#3",
				// 		"images" : [
				// 			{
				// 				"height" : null,
				// 				"url" : "https://scontent-ort2-2.xx.fbcdn.net/v/t1.18169-1/p320x320/15094378_10154116279302749_8365848785354290791_n.jpg?_nc_cat=103&ccb=1-3&_nc_sid=0c64ff&_nc_ohc=RXtfnwEPYfgAX98Y7wt&_nc_ht=scontent-ort2-2.xx&tp=6&oh=df6539e97331192f11e369d16ad9945f&oe=60E0C2BD",
				// 				"width" : null
				// 			}
				// 		]
				// 	}
				// 	payload.related_users.push(d)
				// }
				// if(req.body.friend.id !== 'dacandyman01'){
				// 	var d2 = {
				// 		"friend":true,
				// 		"FLAG":"EXAMPLE ADDED",
				// 		"display_name":"Franky Begue",
				// 		"external_urls":{"spotify":"https://open.spotify.com/user/dacandyman01"},
				// 		"href":"https://api.spotify.com/v1/users/dacandyman01",
				// 		"id":"dacandyman01",
				// 		"images":[{"height":null,"url":"https://scontent-dfw5-2.xx.fbcdn.net/v/t1.6435-1/p320x320/44591294_1856692227700100_9156849281271857152_n.jpg?_nc_cat=107&ccb=1-5&_nc_sid=0c64ff&_nc_ohc=ugv9DAyzYV8AX_u23Gn&_nc_ht=scontent-dfw5-2.xx&edm=AP4hL3IEAAAA&oh=00_AT8x8hagRMZHWeI1CV1GyJUMbhFGN1drumqxjHMDsn_2tg&oe=61DDA67D","width":null}],
				// 		"product":"premium",
				// 		"type":"user",
				// 		"uri":"spotify:user:dacandyman01",
				// 		"followers":{"href":null,"total":38},
				// 		"email":"eugene.f.begue@gmail.com",
				// 		"country":"US",
				// 		"explicit_content":{"filter_enabled":false,"filter_locked":false}}
				// 	payload.related_users.push(d2)
				// }
				//console.log(typeof db_mongo_api.insertStaticUsers)
				db_mongo_api.insertStaticUsers([payload])
				done(payload)
			}, e => {
				fail(e)
			})
		}
	})
}
//note: recall these are CALLS FOR CURRENT AUTH'ED USER!
//(so if testing, make sure to change static refresh token above)

me.storeStaticUser = function (req, res) {

	var proms = [];
	//no limiter
	proms.push(getTopArtists(req))

	//todo: no limiter - uses pageItAter
	proms.push(getFollowedArtists(req))
	proms.push(getMySavedTracks(req))
	//todo: going to skip topTracks for now
	//proms.push(getMyTopTracks(req))
	proms.push(getMySavedAlbums(req))

	Promise.all(proms)
		.then(results => {

			//artist.source = saved or top
			//testing: against a reduced version of myself
			// results[0]  = results[0].slice(0,49)
			// results[1]  = results[1].slice(0,49)
			// results[2].tracks  = results[2].tracks.slice(0,199)
			// results[3]  = results[3].slice(0,49)

			req.body.spotifyApi.getMe()
				.then(c => {
					var payload = {display_name: c.body.display_name, id: c.body.id.toString()}
					//todo: top artists doesn't do stats
					payload = {
						...payload, artists: {artists: results[0].concat(results[1].artists), stats: null},
						//todo: topTracks,recentTracks belongs here ...
						//think I should ignore stats (like recent) and then
						tracks: results[2]
						, albums: results[3]
					}
					payload.artists.artists = payload.artists.artists.map(r => {
						return {
							id: r.id,
							name: r.name,
							source: r.source,
							images: r.images,
							type: r.type,
							familyAgg: r.familyAgg
						}
					})

					const getShallowArtists = (r) => {
						var arts = _.get(r, 'artists')
						return arts.map(r => {
							return {id: r.id, name: r.name, type: "artist"}
						})
					}
					const getShallowAlbum = (r) => {
						return {id: r.id, name: r.name, images: r.images, type: "album"}
					}

					payload.albums.albums = payload.albums.albums.map(r => {
						return {id: r.id, name: r.name, artists: getShallowArtists(r), images: r.images, type: r.type}
					})
					payload.tracks.tracks = payload.tracks.tracks.map(r => {
						return {
							id: r.id,
							name: r.name,
							artists: getShallowArtists(r),
							album: getShallowAlbum(r.album),
							type: r.type
						}
					})


					//testing: faking related users
					getUserPlaylistFriends(req).then(rel => {
						payload.related_users = rel.all_users
						db_mongo_api.insertStaticUsers([payload])
						console.log("storeStaticUser completed", c.body.display_name);
						console.log(payload.artists.artists.length + " artists | " +
							payload.tracks.tracks.length + " tracks | " + payload.albums.albums.length + " albums");
						res.send(payload)
					})
				})
		})
};

//=================================================
//non-user methods

//todo: FUCK ME
//popularity is available for tracks, artists and albums but:
//- returns simplified objects  [https://developer.spotify.com/console/get-artist-albums/]
//-- have to also get the albums [https://developer.spotify.com/console/get-several-albums/]
//- returns un-documented simplified [https://developer.spotify.com/console/get-album-tracks/]
//-- instead use [https://developer.spotify.com/console/get-several-tracks/]

//spotify:track:3sHH7lklbfpcraDDvYnjo7
//spotify:album:55tK4Ab7XHTOKkw0xDz3AA
//spotify:artist:0nmQIMXWTXfhgOBdNzhGOs
//lil wayne (1950 releases)
//55Aa2cqylxrFIXC767Z865

var limiterSpotifyTest = new Bottleneck({
	maxConcurrent: 10,
	minTime: 100,
	trackDoneStatus: true
});

me.test = function (req, res) {
	//getArtistPopularity(req)
	//getArtistAlbums(req,'0nmQIMXWTXfhgOBdNzhGOs')
	// getArtistAlbumsRange(req,'55Aa2cqylxrFIXC767Z865')
	var sampleShallowAlbums = [
		{
			"id": "1gX9FQEDTgJAjX1dpaUyFC",
			"name": "John Butler (Remastered)",
			"artists": [
				{
					"id": "6fBF4MULW5yMzyGaon1kUt",
					"name": "John Butler Trio"
				}
			]
		},
		{
			"id": "5yN7aMyqzgyEYbfKnZmctH",
			"name": "Queue: The Mixtape",
			"artists": [
				{
					"id": "1Rxe2OboMb1Bx2n49182AJ",
					"name": "Stoop Kids"
				}
			]
		},
		{
			"id": "1xNEWB5CDirJ5WcD3or9bv",
			"name": "Already Out of Time",
			"artists": [
				{
					"id": "1Rxe2OboMb1Bx2n49182AJ",
					"name": "Stoop Kids"
				}
			]
		}]

	var sampleShallowTracks = [{
		"id": "0hDQV9X1Da5JrwhK8gu86p",
		"name": "Maps",
		"artists": [
			{
				"id": "3TNt4aUIxgfy9aoaft5Jj2",
				"name": "Yeah Yeah Yeahs"
			}
		]
	},
		{
			"id": "6UUhrj3mUGuwjOwg7iw0to",
			"name": "Cranium",
			"artists": [
				{
					"id": "6Nwhmo3adbTqPMCsgBgkf4",
					"name": "Slothrust"
				}
			]
		},
		{
			"id": "3Z92O6VsRSexrcigaWiyzM",
			"name": "Alabaster",
			"artists": [
				{
					"id": "6FxuPrpa8phaP3Xn73emhT",
					"name": "The Wood Brothers"
				}
			]
		}]
	getMySavedTracks(req, sampleShallowTracks)
		.then(r => {
			// getMySavedAlbums(req,sampleShallowAlbums)
			// 	.then(r =>{

			//todo: both of these were made for a batch of artists
			//db_api.commitArtistGenres()

			//todo: above guy has no return sig - so have to repull
			//pullPromises.push(db_api.checkDBForArtistGenres(p,'payload'))

			res.send(r)

		}, err => {
			console.error(err);
			res.status(500).send(err)
		})

	//todo imagine this would be happening where exactly?
	//simplest case is tacking on to getArtists and what not, so start there

	//todo: schedule these, use batched result
	// getRelatedArtists(req,'55Aa2cqylxrFIXC767Z865')
	// 	.then(r =>{
	//
	// 		//todo: both of these were made for a batch of artists
	// 		//db_api.commitArtistGenres()
	//
	// 		//todo: above guy has no return sig - so have to repull
	// 		//pullPromises.push(db_api.checkDBForArtistGenres(p,'payload'))
	//
	// 		res.send(r)
	//
	// 	},err =>{
	// 		console.error(err);
	// 		res.status(500).send(err)
	// 	})
}


//currently you see this @ playlistResolve > resolveArtists
//which does a payload type deal b/c we don't have the genres
//with related we just ned to grab them and commit the artist + fully qualify the genres

var getRelatedArtists = function (req, artist_id) {
	return new Promise(function (done, fail) {
		//console.log("getArtistAlbumsRange",artist_id);
		//req.body.spotifyApi.getArtistRelatedArtists(id)

		let uri = "https://api.spotify.com/v1/artists/" + artist_id + "/related-artists"
		let options = {
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			json: true
		};
		//	console.log(options.uri);
		network_utility.fetchTry(options.uri, options, 3, 300)
			.then(r => {

				done({id: artist_id, related_artists: r.artists})
			}, e2 => {
				fail(e2)
			})
	})
}


var getArtistTopTracks = function (req) {
	return new Promise(function (done, fail) {
		//console.log("getArtistTopTracks");
		//console.log("$getArtistTopTracks",req.body.id);
		req.body.spotifyApi.getArtistTopTracks(req.body.artist.id, 'ES')
			.then(r => {
				var ids = r.body.tracks.slice(0, 5).map(r => {
					return {id: r.id, name: r.name}
				})
				done(ids)
				//note: on failure, still resolve w/ notice as such
			}, e => {
				debugger
				console.error(e);
				done({failure: e})
			})
		//.then(r => { res.send(r.body.tracks)},err =>{res.status(500).send(err)})
	})
}


//todo: little bit of repeated code (below) where for a certain use-case I never wanted to fail out?
var getArtistTopTracks = function (req) {
	return new Promise(function (done, fail) {
		//console.log("getArtistTopTracks");
		//console.log("$getArtistTopTracks",req.body.id);
		req.body.spotifyApi.getArtistTopTracks(req.body.artist.id, 'ES')
			.then(r => {
				var ids = r.body.tracks.slice(0, 5).map(r => {
					return {id: r.id, name: r.name}
				})
				done(ids)
				//note: on failure, still resolve w/ notice as such
			}, e => {
				debugger
				console.error(e);
				done({failure: e})
			})
		//.then(r => { res.send(r.body.tracks)},err =>{res.status(500).send(err)})
	})
}


var _getArtistTopTracks = async function (req, artistId) {
	try {
		var res = await req.body.spotifyApi.getArtistTopTracks(artistId, 'ES')
		return res.body.tracks
	} catch (e) {

		throw e
	}
}

//note: example of weird spotifyApi library behavior where I can't schedule straight-spotifyApi calls
//produces: this.getAccessToken is not a function
//instead have to wrap like _getArtistTopTracks


me.createArtistsPlaylist = async function (req, res) {
	console.log("createArtistsPlaylist", req.body.playlistName);
	debugger
	//testing:
	//req.body.artists = req.body.artists.slice(0,70)
	//todo: UI is sending some songkick ids
	req.body.artists = req.body.artists.filter(a => {
		return typeof a === 'string'
	});


	//req.body.artists = req.body.artists.filter(r => typeof r.id)

	try {
		var task = async function (id) {
			//note: id stays the same like this??
			// delete req.body.artist
			// req.body.artist= {id:id}
			//var _req = {body:{spotifyApi:req.body.spotifyApi,artist:{id:id}}}

			try {
				//note: straight-spotifyApi
				//var response = await limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')
				var response = await limiter.schedule(_getArtistTopTracks, req, id)
				return response;
			} catch (e) {
				debugger
			}
		}

		var proms = req.body.artists.map(task);
		debugger
		var songSets = await Promise.all(proms)
		debugger
		var songs = [];
		songSets.forEach(s => {
			songs = songs.concat(s.slice(0, req.body.tracksLimit))
		})

		//testing: split by day

		var r = await limiter.schedule(me.createPlaylist, req, req.body.user, {name: req.body.playlistName}, songs)
		debugger
		//note: when tracksR submits the playlist, it tacks on myCreated/myUpdated
		var tracksR = await db_mongo_api.trackUserPlaylist(req.body.user, r.playlist)
		res.send(tracksR)
	} catch (e) {
		debugger
		res.status(500).send(e)
	}
};


me.testSave = async function (req, res) {
	var rTrack = await db_mongo_api.trackUserPlaylist(req.body.user, "3evs360A5LkM7qv0NXuTgP")
	debugger
}
me.getArtistTopTracks = function (req, res) {
	getArtistTopTracks(req)
		.then(r => {
			res.send(r)
		})
	//.catch(e =>{res.status(500).send(e)})
};


var getTracks = async function (req, payload) {
	try {
		console.log("getTracks", payload.length);

		var res = await req.body.spotifyApi.getTracks(payload)
		return res.body.tracks
		// if(res.failure){
		// 	return {artist: r.options.artist,failure:r.failure}
		// }
		// return {artist: req.body.artist, result: r}

	} catch (e) {
		throw e
	}
}


//todo: switch to manual api call to speciffy release type
//todo: so lil wayne has 1950 releases...
//made me realize I grab just the beginning and end of the set, and i'll 100% need it customized

var getArtistAlbums = function (req, artist_id) {
	return new Promise(function (done, fail) {
		console.log("getArtistAlbums", artist_id);
		req.body.spotifyApi.getArtistAlbums(artist_id, {limit: 50})
			.then(network_utility.pageIt.bind(null, req, null))
			.then(a => {
				//a.items = a.items.filter(a =>{return a.album_group === 'album'})
				a.items = a.items.sort((a1, a2) => {
					return new Date(a1.release_date) > new Date(a2.release_date)
				})

				//console.log(a.items);
				done(a.items)
			}, e => {
				fail(e)
			})
	})
}


var getAlbums = function (req, payload) {
	return new Promise(function (done, fail) {
		console.log("getAlbums", payload.length);
		req.body.spotifyApi.getAlbums(payload)
			.then(tracksres => {
				done(tracksres.body.albums)
			}, e => {
				fail(e)
			})
	})
}

var resolveAlbumTracks = async function (req, id) {

	var fitTry = async function (req, id) {
		try {
			var res = await req.body.spotifyApi.getAlbumTracks(id, {limit: 50});
			return res
		} catch (e) {
			throw e
		}	try {
			var task = async function (id) {
				//note: id stays the same like this??
				// delete req.body.artist
				// req.body.artist= {id:id}
				//var _req = {body:{spotifyApi:req.body.spotifyApi,artist:{id:id}}}

				try {
					//note: straight-spotifyApi
					//var response = await limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')
					var response = await limiter.schedule(_getArtistTopTracks, req, id)
					return response;
				} catch (e) {
					debugger
				}
			}

			var proms = req.body.artists.map(task);
			debugger
			var songSets = await Promise.all(proms)
			debugger
			var songs = [];
			songSets.forEach(s => {
				songs = songs.concat(s.slice(0, req.body.tracksLimit))
			})

			//testing: split by day

			var r = await limiter.schedule(me.createPlaylist, req, req.body.user, {name: req.body.playlistName}, songs)
			debugger
			//note: when tracksR submits the playlist, it tacks on myCreated/myUpdated
			var tracksR = await db_mongo_api.trackUserPlaylist(req.body.user, r.playlist)
			res.send(tracksR)
		} catch (e) {
			debugger
			res.status(500).send(e)
		}	try {
			var task = async function (id) {
				//note: id stays the same like this??
				// delete req.body.artist
				// req.body.artist= {id:id}
				//var _req = {body:{spotifyApi:req.body.spotifyApi,artist:{id:id}}}

				try {
					//note: straight-spotifyApi
					//var response = await limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')
					var response = await limiter.schedule(_getArtistTopTracks, req, id)
					return response;
				} catch (e) {
					debugger
				}
			}

			var proms = req.body.artists.map(task);
			debugger
			var songSets = await Promise.all(proms)
			debugger
			var songs = [];
			songSets.forEach(s => {
				songs = songs.concat(s.slice(0, req.body.tracksLimit))
			})

			//testing: split by day

			var r = await limiter.schedule(me.createPlaylist, req, req.body.user, {name: req.body.playlistName}, songs)
			debugger
			//note: when tracksR submits the playlist, it tacks on myCreated/myUpdated
			var tracksR = await db_mongo_api.trackUserPlaylist(req.body.user, r.playlist)
			res.send(tracksR)
		} catch (e) {
			debugger
			res.status(500).send(e)
		}
	}

	try {
		console.log("resolveAlbumTracks", id);
		//todo: getAccessToken is undefined? simple wrapper returns simple e w/ no retry
		//var atres = await limiter.schedule(req.body.spotifyApi.getAlbumTracks,id, { limit : 50})
		var atres = await limiter.schedule(fitTry, req, id, {limit: 50})

		//testing: works, but only 1x
		//var atres = await req.body.spotifyApi.getAlbumTracks(id, { limit : 50})


		var payloads = [];
		var payload = [];

		//todo: as long as tracks don't have more than 50 songs, shouldn't need to do this

		atres.body.items.forEach((t, i) => {
			if (i === 0) {
				payload.push(t.id)
			} else {
				if (!(i % 50 === 0)) {
					payload.push(t.id)
				} else {
					payloads.push(payload);
					payload = [];
					payload.push(t.id)
				}
			}
		})
		payload.length ? payloads.push(payload) : {};

		// payloads.forEach(function(pay){
		// 	proms.push(limiter.schedule(getTracks,req,pay,{}))
		// 	//proms.push(limiterSpotifyTest.schedule(req.body.spotifyApi.getTracks,pay))
		// });

		var task = async function (pay) {
			try {
				var response = await limiter.schedule(getTracks, req, pay, {})
				return response;
			} catch (e) {
				debugger
			}
		}
		var proms = payloads.map(task);

		var mresults = await Promise.all(proms)
		// var ret = [];
		// mresults.forEach(r =>{ret = ret.concat(r)})

		return mresults
	} catch (e) {
		debugger
	}

}
me.resolveAlbumTracks = resolveAlbumTracks;

var resolveAlbums = function (req, albums) {
	return new Promise(function (done, fail) {
		console.log("resolveAlbums", albums.length);

		var proms = [];
		var payloads = [];
		var payload = [];

		//note: what the fuck does this comment mean?
		//todo: as long as artists don't have more than 50 albums

		albums.forEach((t, i) => {
			if (i === 0) {
				payload.push(t.id)
			} else {
				if (!(i % 50 === 0)) {
					payload.push(t.id)
				} else {
					payloads.push(payload);
					payload = [];
					payload.push(t.id)
				}
			}
		})
		payload.length ? payloads.push(payload) : {};
		payloads.forEach(function (pay) {
			proms.push(limiterSpotifyTest.schedule(getAlbums, req, pay, {}))
			//todo: why the fuck can't I just push API calls directly?
			//proms.push(limiterSpotifyTest.schedule(req.body.spotifyApi.getTracks,pay))
		});
		Promise.all(proms)
			.then(mresults => {
				var ret = [];
				mresults.forEach(r => {
					ret = ret.concat(r)
				})
				done(ret)
			}, e => {
				fail(e)
			})

	})
}

//todo: thought about getting popularity here as well
//but these are simplified album objects

//todo: what groups to get is a contextual problem
//thought album,single would be most applicable, but then you have someone as classic as John Williams
//for which album,single only reports 1993 as earliest sooo yeah..

//for lil wayne though, does this make sense? being wrong by not going far back ENOUGH always must be worse than the inverse, right?
var getArtistReleaseRange = function (req, artist_id) {
	return new Promise(function (done, fail) {
		//console.log("getArtistAlbumsRange",artist_id);

		//var groups = "include_groups=album,single";
		var groups = "include_groups=album,single,appears_on,compilation"
		//console.log("getArtistAlbumsRange",artist_id);
		let uri = "https://api.spotify.com/v1/artists/" + artist_id + "/albums?" + groups + "&offset=0&limit=5"
		//let uri = "https://api.spotify.com/v1/artists/" + artist_id + "/albums?include_groups=album,single,compilation&offset=0&limit=5"
		let options = {
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			json: true
		};
		//console.log(options.uri);
		limiter.schedule(network_utility.fetchTry, options.uri, options, 3, 300)
			// rp(options)
			.then(r => {
				//console.log("latest",r.items[0]);
				if (!r.items) {
					debugger
				}
				delete r.items[0].artists
				delete r.items[0].available_markets

				//only do the 2nd fetch if we need to
				if (r.total > 50) {
					options.uri = "https://api.spotify.com/v1/artists/" + artist_id + "/albums?" + groups + "&offset=" + (r.total - 1).toString() + "&limit=10"
					//options.uri = "https://api.spotify.com/v1/artists/" + artist_id + "/albums?include_groups=album,single&offset=" + (r.total -1).toString() + "&limit=10"
					//console.log(options.uri);
					limiter.schedule(network_utility.fetchTry, options.uri, options, 3, 300)
						.then(r2 => {

							delete r2.items[0].artists
							delete r2.items[0].available_markets
							//console.log("earliest",r2.items[0]);
							done({
								id: artist_id, release_range: {
									earliest: r2.items[0],
									latest: r.items[0]
								}
							})
						}, e => {
							fail(e)
						})
				} else {
					delete r.items[r.items.length - 1].artists
					delete r.items[r.items.length - 1].available_markets
					done({
						id: artist_id, release_range: {
							earliest: r.items[r.items.length - 1],
							latest: r.items[0]
						}
					})
				}

				// rp(options)


			}, e2 => {
				debugger
				fail(e2)
			})
	})
}

//todo: untested
var getArtistAlbumsTimeline = function (req, artist_id) {
	return new Promise(function (done, fail) {

		//todo: replace with new getArtistAlbums stub above
		req.body.spotifyApi.getArtistAlbums(req.body.id, {limit: 50})
			.then(network_utility.pageIt.bind(null, req, null))
			.then(a => {
				//sort all tracks by popularity
				//determine what albums have what tracks = album popularity
				//console.log(t.body.tracks);
				var atProms = [];
				//console.log(a.items);

				//note: manual filter for only full albums
				a.items = a.items.filter(a => {
					return a.album_group === 'album'
				})
				//console.log("albums",a.items.length);

				//todo: worth reducing?
				//var albums = a.items.map(a =>{return {id:a.id,name:a.name,images:a.images,release_date:a.release_date}})

				a.items.forEach(a => {
					//todo: designed this poorly - resolveAlbum is susceptible to rate limit
					//(b/c resolveAlbum branches into many get tracks?)
					// atProms.push(limiterSpotifyTest.schedule(resolveAlbum,req,a.id))
					atProms.push(resolveAlbumTracks(req, a.id))
				})

				resolveAlbums(req, a.items)
					.then(ralbums => {
						//console.log(ralbums);
						Promise.all(atProms)
							.then(results => {

								//tracks have simplified albums to map back to
								//todo: somehow fucked up this return here
								var ret = [];
								[]
								results.forEach(r => {
									ret = ret.concat(r[0])
								})

								//todo:unwind tracks, mutate with full album pop
								// create array with {album id:"",album pop:"",album release:"",tracks:  [<trackPop>,...]}

								// ret.forEach(t =>{
								//
								// })

								done(popArtistOb)
							}, e => {
								fail(e)
							})
					}, err => {
						fail(err);
					})

			})
	})
}

me._getArtistInfo = async function (req, artist) {
	//req.body.artist

	//console.log("getArtistInfo...");
	try {
		var artistSongkick = await songkick_api.searchArtistSongkick(artist)
		//var range = await limiter.schedule(getArtistReleaseRange,req,artist.id)
		var range = await getArtistReleaseRange(req, artist.id)
		//var artist = await getArtistPopularity(req,artist.id) //...artist,
		var r = {...range, onTourUntil: artistSongkick?.onTourUntil || null}
	} catch (error) {
		console.error(error);
		throw error
	}
	return r
}
me.getArtistInfo = function (req, res) {
	me._getArtistInfo(req, req.body.artist)
		.then(r => {
			res.send(r)
		}, e => {
			res.status(500).send(e)
		})

}

var getArtistPopularity = function (req, artist_id) {
	return new Promise(function (done, fail) {
		//note: not clear what determines 'top tracks' for an artist in a country
		//- doesn't seem like it's plays though (from experience)
		// - year of earliest/latest albums
		// - graph of popularity over time
		// 	- abstracted from mean track popularity?

		console.log("getArtistPopularity", artist_id);

		req.body.spotifyApi.getArtist(artist_id)
			.then(ares => {
				var popArtistOb = {id: ares.body.id, popularity: ares.body.popularity, followers: ares.body.followers}
				//console.log(popArtistOb);
				done(popArtistOb)
			}, e => {
				fail(e)
			})
	})
}


//other methods----------------------------------------------------------
//
// app.post('/createPlaylist', (req, res) => {
// 	console.log("createPlaylist");
// 	res.send({ application: 'soundfound'});
// })

me.createPlaylistEnd = function (req, res) {
	req.body.spotifyApi.createPlaylist(req.body.user.id, req.body.playlist.name, {
		'description': 'My description',
		'public': true
	})
		.then(createPlaylistResponse => {
			res.send({endpoint: 'createPlaylistEnd'});
		})
		.catch(e => {
			res.status(500).send(e)
		})
}

me.createPlaylistSpotifyEnd = async function (req, res) {

	let uri = `https://api.spotify.com/v1/users/${req.body.user.id}/playlists`

	let options = {
		//method: "GET",
		uri: uri,
		headers: {
			'User-Agent': 'Request-Promise',
			"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
		},
		// body: {
		// 	"name": req.body.playlist.name,
		// 	"description": "New playlist description",
		// 	"public": false
		// },
		json: true
	};

	return rp(options)
		.then(function (r) {
			//console.log(options.uri);
			if (r.failure) {
				return {artist: r.options.artist, failure: r.failure}
			}
			debugger
			return {artist: req.body.artist, result: r}
		}, function (err) {
			console.error(err.response.statusMessage);
			debugger
			throw(err);
		});
}

me.createPlaylistSpotifyEndFetchTry = async function (req, res) {

	let uri = `https://api.spotify.com/v1/users/${req.body.user.id}/playlists`

	let options = {
		method: "GET",
		uri: uri,
		headers: {
			'User-Agent': 'Request-Promise',
			"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
		},
		// body: {
		// 	"name": req.body.playlist.name,
		// 	"description": "New playlist description",
		// 	"public": false
		// },
		json: true
	};

	return network_utility.fetchTry(uri, options, 3, 300)
		.then(function (r) {
			//console.log(options.uri);
			if (r.failure) {
				return {artist: r.options.artist, failure: r.failure}
			}
			debugger
			return {artist: req.body.artist, result: r}
		}, function (err) {
			console.error(err);
			debugger
			throw(err);
		});
}

me.searchArtistEnd = async function (req,res) {

	req.body.artist = {
			"id": 10241420,
			"name": "Ra (US)",
			"genres": [],
			"notFound": true,
			"familyAgg": null
		}

	let nameClean = req.body.artist.name.replace(/\(US\)/g, "");
	nameClean = nameClean.replace(/[^a-zA-Z\s]/g, "");
	nameClean = encodeURIComponent(nameClean)

	if (nameClean === "") {
		return {artist: req.body.artist, failure: {reason: "bad name parse", parseValue: nameClean}}
	} else {

		let uri = "https://api.spotify.com/v1/search?query=" + nameClean + "&type=artist&offset=0&limit=20"
		let options = {
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			//artist: {name: req.body.artist},
			json: true
		};
		// return network_utility.fetchTry(options.uri,options,3,300)
		return rp(options)
			// req.body.spotifyApi.searchArtists(req.body.artist.name)
			.then(function (r) {
				//console.log(options.uri);
				if (r.failure) {
					return {artist: r.options.artist, failure: r.failure}
				}

				//return {artist: req.body.artist, result: r}
				res.send({artist: req.body.artist, result: r})

			}, function (err) {
				console.error(err);
				debugger
				throw(err);
			});

	}
}

me.createPlaylist = function (req, user, playlist, songs) {
	return new Promise(function (done, fail) {
		console.log("createPlaylist", songs.length);

		req.body.spotifyApi.createPlaylist(user.id, playlist.name, {'description': 'My description', 'public': true})
			.then(createPlaylistResponse => {
				debugger
				//var payload = [];
				//songs.forEach(songOb =>{
				//payload.push("spotify:track:" + songOb.id)
				//})

				var payloads = [];
				var payload = [];
				songs.forEach((s, i) => {
					if (i === 0) {
						payload.push("spotify:track:" + s.id)
					} else {
						if (!(i % 50 === 0)) {
							payload.push("spotify:track:" + s.id)
						} else {
							payloads.push(payload);
							payload = [];
							payload.push("spotify:track:" + s.id)
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
						//var response = await limiter.schedule(req.body.spotifyApi.getArtistTopTracks,req.body.artist.id, 'ES')

						//todo: somehow limiter is reporting /createArtistPlaylist as the url it's retrying - but that's not true?
						var response = await limiter.schedule(_addTracksToPlaylist, req, createPlaylistResponse.body.id, payload)
						return response;
					} catch (e) {
						debugger
					}
				}

				var proms = payloads.map(task);
				Promise.all(proms)
					// spotifyApi.addTracksToPlaylist(r.body.id,payload)
					.then(function (data) {
						console.log('Added tracks to playlist!');
						done({result: "success", playlist: createPlaylistResponse.body})
					}, function (err) {
						console.log('Something went wrong!', err);
						debugger;
						fail({error: err})
					});

			}, err => {
				fail(err)
			})
	})
}

//WIP----------------------------------------------------------

//todo: move artist to req.artist
//todo: for some reason I turned this into an api function

// me.searchArtist = function (req,res,next) {
// 	var artist = {name:"Queen"};
// 	//console.log(query);
// 	spotifyApi.searchArtists(artist.name)
// 		.then(function (r) {
// 			 done({artist: artist, result: r})
// 			//res.send(r);
// 		}, function (err) {
// 			console.error(err);
// 			next(err)
// 		});
// };

//this is exposed for use by songkick only pretty much?

// process.on('unhandledRejection', (reason, p) => {
// 	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
// 	console.log(reason.stack);
// 	// application specific logging, throwing an error, or other logic here
// });


//todo: combine with general search below
me.searchArtist = async function (req) {

	//console.log("searchArtists",req.body.artist.name);
	//todo: only fixing for songkick for now
	//will return to test later when this endpoint is back up on UI
	//basically: if we didn't get one from the middleware, its not coming from the UI - so make your own

	let nameClean = req.body.artist.name.replace(/\(US\)/g, "");
	nameClean = nameClean.replace(/[^a-zA-Z\s]/g, "");
	nameClean = encodeURIComponent(nameClean)

	if (nameClean === "") {
		return {artist: req.body.artist, failure: {reason: "bad name parse", parseValue: nameClean}}
	} else {

		let uri = "https://api.spotify.com/v1/search?query=" + nameClean + "&type=artist&offset=0&limit=20"
		let options = {
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			artist: {name: req.body.artist},
			json: true
		};
		// return network_utility.fetchTry(options.uri,options,3,300)
		return rp(options)
			// req.body.spotifyApi.searchArtists(req.body.artist.name)
			.then(function (r) {
				//console.log(options.uri);
				if (r.failure) {
					return {artist: r.options.artist, failure: r.failure}
				}
				// if(options.uri === "https://api.spotify.com/v1/search?query=Madi%20Sipes%20%20The%20Painted%20Blue&type=artist&offset=0&limit=20"){
				// 	debugger
				// }

				return {artist: req.body.artist, result: r}
			}, function (err) {
				//console.error(err);
				throw(err);
			});

	}
}


/**
 * @typedef {object} item
 * @property {string} name - artist name
 * @property {string} type - enum: album|artist|track
 */
/**
 * @method
 * @param req
 * @param {...item} item
 * @returns {Promise<any|{artist: *, failure: {reason: string, parseValue: string}}>}
 */
me.searchSpotify = async function (req, item) {

	//replace "US" after some names
	let nameClean = item.name.replace(/\(US\)/g, "");
	//replace any any weirdos
	nameClean = nameClean.replace(/[^a-zA-Z\s\d\\.]/g, "");
	nameClean = encodeURIComponent(nameClean)

	if (nameClean === "") {
		debugger
		return {item: item, failure: {reason: "empty name parse"}}
	} else {

		let uri = "https://api.spotify.com/v1/search?query=" + nameClean + "&type=" + item.type + "&offset=0&limit=20"
		let options = {
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			json: true
		};


		return network_utility.fetchTry(uri, options, 3, 300)
			// req.body.spotifyApi.searchArtists(req.body.artist.name)
			.then(function (r) {

				//console.log(options.uri);
				if (r.failure) {
					debugger
					return {item: r.options.artist, failure: r.failure}
				}
				// if(options.uri === "https://api.spotify.com/v1/search?query=Madi%20Sipes%20%20The%20Painted%20Blue&type=artist&offset=0&limit=20"){
				// 	debugger
				// }

				return {item: item, result: r[item.type + "s"]}
			}, function (err) {
				//console.error(err);
				throw(err);
			});

	}
}


//exposing an endpoint that uses it to the UI
me.completeArtist = function (req, res) {

	//todo: ajax thing (or not jesus lol fix this!)
	//console.log(req.body.artistQuery);
	//req.body.artistQuery ="Queen"

	me.searchArtist(req)
		.then(r => {

			//no no I HAVE genres, I don't have QUALIFIED genres
			// var ids = r.result.body.artists.items.map(a =>{return a.id})
			// resolver_api.spotifyArtists(ids)
			// 	.then(r =>{
			// 		res.send(r);
			// 	},err =>{res.status(500).send(err)})

			//todo: this is similar to the (very messy) process for fetchMetroEvents
			//... checkDBFor_artist_artistSongkick_match in songkick.js

			//but I don't really 'need' to worry about submitting every searched artist
			//into my DB? but I do need to know if my system already knows about the genre

			//testing: for now, just do the bare minimum until I do a rerwrite on ^^^

			var qualifyGenrePromises = [];
			r.result.body.artists.items.forEach(r => {
				//todo: if we passed the whole artist = replace in place
				//for now just do a costly unwind later
				// qualifyGenrePromises.push(qualifyGenres(r.genres))
				r.genres.forEach(g => {
					qualifyGenrePromises.push(db_api.qualifyGenre(g));
				})
			})

			//console.log(qualifyGenrePromises.length);
			Promise.all(qualifyGenrePromises)
				.then(r2 => {
					r.result.body.artists.items.forEach((r, i, arr) => {
						//todo: if we passed the whole artist = replace in place
						//for now just do a 'costly' unwind later (its 20 artists how many genres could there be? :))
						// qualifyGenrePromises.push(qualifyGenres(r.genres))
						var gsqual = [];
						r.genres.forEach((gName, i, arr) => {
							var f = _.find(r2, function (gq) {
								return gName === gq.name;
							});
							gsqual.push(f);
						})
						arr[i].genres = gsqual;
					})
					res.send(r);

				}, err => {
					res.status(500).send(err)
				})
		}, err => {
			res.status(500).send(err)
		})

};


var _getAlbum = async function (req, id) {
	try {
		var res = await req.body.spotifyApi.getAlbum(id)
		return res.body
	} catch (e) {

		throw e
	}
}

var _getTrack = async function (req, id) {
	try {
		var res = await req.body.spotifyApi.getTrack(id)
		return res.body
	} catch (e) {
		throw e
	}
}
me.getPlaying = async function (req, res) {
	try {
		let uri = "https://api.spotify.com/v1/me/player/currently-playing"
		let options = {
			method: "GET",
			uri: uri,
			headers: {
				'User-Agent': 'Request-Promise',
				"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
			},
			json: true
		};

		console.log({options});
		let trackResult = await rp(options)

		//todo: for whatever reason, when nothing is playing, instead of failing it just comes back undefined
		if (trackResult) {

			let artistResult = await req.body.spotifyApi.getArtist(trackResult.item.artists[0].id)

			let albumsResult = await req.body.spotifyApi.getArtistAlbums(trackResult.item.artists[0].id,{limit: 50})
				.then(network_utility.pageIt.bind(null, req, null, null))
				.then(r => {
					return r
				})

			let albumsIds = albumsResult.items.map(a => a.id)

			try {
				var task = async function (id) {
					try {
						var album = await limiter.schedule(_getAlbum,req, id)
						return album;
					} catch (e) {
						debugger
					}
				}
				var proms = albumsIds.map(task);
			} catch (e) {
				debugger
			}

			let albumsQualifiedResult = await Promise.all(proms);
			let playingTrackAlbum = albumsQualifiedResult.find(a =>{return a.id===trackResult.item.album.id})
			let playingTrackAlbumTrackIds = playingTrackAlbum.tracks.items.map(a => a.id)


			//note: getAlbum includes track ids but does NOT include popularity of tracks
			//note: getAlbumTracks does NOT include popularity of tracks

			try {
				var task2 = async function (id) {
					try {
						var response = await limiter.schedule(_getTrack,req, id)
						return response;
					} catch (e) {
						debugger
					}
				}
				var proms2 = playingTrackAlbumTrackIds.map(task2);
			} catch (e) {
				debugger
			}
			let playingTrackAlbumTrackQualifiedResult = await Promise.all(proms2);
			let tracksPopularity = playingTrackAlbumTrackQualifiedResult
				.map(track => ({ name: track.name, id: track.id, popularity: track.popularity }))
				.sort((a, b) => a.popularity - b.popularity ); // Sort in asc order

			let albumsPopularity = albumsQualifiedResult
				.map(al => ({ name: al.name, id: al.id, popularity: al.popularity,release:al.release_date}))
				.sort((a, b) => a.popularity - b.popularity ); // Sort in asc order

			//note: artist overall popularity, the playing album versus all albums, the playing track versus OTHER TRACKS ON ALBUM
			//note:
			//todo: to get overall popularity of track for artist, would have to go fetch every single track which is rough ...
			// - since artist top tracks are plays AND TIME, not really apprporiate here
			let popularity = {
				artist:artistResult.body.popularity,
				album:playingTrackAlbum.popularity,
				albums:albumsPopularity,
				track:trackResult.item.popularity,
				tracks:tracksPopularity
			}

			req.body.artistQuery = trackResult.item.artists[0].name;
			let artistInfoResult = await wikipedia_api.getArtistInfoWiki(req)

			var pay = {track: trackResult.item, artist: artistResult.body,artistInfo:{wikipedia: artistInfoResult.artistInfo},popularity:popularity};
			console.log("getPlaying finished", pay.track.name);
			res.send(pay)
		} else {
			let msg = "getPlaying finished - nothing is playing right now"
			console.warn(msg);
			res.send({msg: msg, track: null, artist: null})
		}
	}catch(e){
		console.error(e)
		res.status(500).send(e)
	}
};

me.saveCurrentlyPlayingTrack = function (req, res) {
	let uri = "https://api.spotify.com/v1/me/player/currently-playing"
	let options = {
		method: "GET",
		uri: uri,
		headers: {
			'User-Agent': 'Request-Promise',
			"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
		},
		json: true
	};
	//console.log({options});
	rp(options)
		.then(track => {
			console.log("track", track.item.id);
			var options2 = {
				method: "PUT",
				url: 'https://api.spotify.com/v1/me/tracks?ids=' + track.item.id,
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					"Authorization": "Bearer " + req.body.spotifyApi.getAccessToken()
				}
			};
			rp(options2)
				.then(response => {
					console.log("response", response)
					res.send({success: true})
				}, e => {
				})
		}, err => {
			console.log("err", err);
			res.status(500).send(err)
		})
};

me.pausePlay = function (req, res) {
	let uri = "https://api.spotify.com/v1/me/player"
	let options = {
		method: "GET",
		uri: uri,
		headers: {
			'User-Agent': 'Request-Promise',
			"Authorization": 'Bearer ' + req.body.spotifyApi.getAccessToken()
		},
		json: true
	};
	//console.log({options});

	rp(options)
		.then(state => {
			//todo: state is undefined, but the request didn't "fail" soooo??
			if (!state) {
				var err = "failure: !state success"
				console.log("err", err);
				res.status(500).send(err)
			} else {
				if (state.is_playing) {
					var options2 = {
						method: "PUT",
						url: "https://api.spotify.com/v1/me/player/pause",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"Authorization": "Bearer " + req.body.spotifyApi.getAccessToken()
						}
					};
				} else {
					var options2 = {
						method: "PUT",
						url: "https://api.spotify.com/v1/me/player/play",
						headers: {
							"Accept": "application/json",
							"Content-Type": "application/json",
							"Authorization": "Bearer " + req.body.spotifyApi.getAccessToken()
						}
					};
				}

				rp(options2)
					.then(response => {
						console.log("response", response)
						res.send({success: true})
					}, err => {
						console.log("err", err);
						res.status(500).send(err)
					})
			}

		}, err => {
			debugger
			console.log("err", err);
			res.status(500).send(err)
		})
};

//testing: method for calling endpoints from local functions (never could get it working)
// me.sortSavedTracks  =  function(req,res){
// 	return new Promise(function(done, fail) {
//
// 		//basically just send a res that will be the callback
// 		//and remove the .then() from it b/c it will be immediately undefined otherwise
// 		var req2 = {};var res2 = {send:function(d){
// 				console.log("here",d)
// 				res.send(d);
// 			}};
// 		me.getMySavedTracks(req2,res2)
// 		console.log("fun!");
// 		// spotifyApi.getMySavedTracks({limit : 50})
// 		// 	.then(function (r) {
// 		// 		done({artist: artist, result: r})
// 		// 		//res.send(r);
// 		// 	}, function (err) {
// 		// 		console.error(err);
// 		// 		fail(err);
// 		// 	});
// 	})
// }

//=================================================
//resolving methods


function difference(origObj, newObj) {
	function changes(newObj, origObj) {
		let arrayIndexCounter = 0
		return transform(newObj, function (result, value, key) {
			if (!isEqual(value, origObj[key])) {
				let resultKey = isArray(origObj) ? arrayIndexCounter++ : key
				result[resultKey] = (isObject(value) && isObject(origObj[key])) ? changes(value, origObj[key]) : value
			}
		})
	}

	return changes(newObj, origObj)
}

me.getSnapshotDelta = function (req, res) {

	snapshotPlaylists(req)
		.then(tuple => {
			//console.log("current snap",tuple.snap);
			db_mongo_api.fetchStaticUser(req.body.user)
				.then(r => {
					//console.log("cache snap",r[0].snapMap);
					var d = difference(tuple.snap, r.snapMap)
					var ret = []
					if (d) {
						//resolve these playlists
						Object.keys(d).forEach(id => {
							ret.push(tuple.imap[id])
						})

						// var diffObArray = Object.keys(d).map(k =>{return {id:k}})
						// req.body.playlists = diffObArray
						// resolver.resolvePlaylists(req.body)
						// 	.then(r =>{
						// 		console.log(r);
						// 	})
					}
					res.send(ret)
				})

			// db_mongo_api.saveSnapshotPlaylists(req.body.user.id,snap)
			// 	.then(r =>{
			// 		console.log("snapshotPlaylists finished",r);
			// 	})
		})
}

var snapshotPlaylists = function (req) {
	return new Promise(function (done, fail) {
		req.body.spotifyApi.getUserPlaylists(req.body.user.id, {limit: 50})
			.then(network_utility.pageIt.bind(null, req, null))
			.then(r => {
				console.log("total playlists length", r.items.length);
				var snap = {};
				var imap = {};
				r.items.filter(item => {
					return item.owner.id === req.body.user.id
				})
					.forEach(p => {
						imap[p.id] = p;
						snap[p.id] = p.snapshot_id
					})

				//testing: save new snap
				// console.log("new snap",snap);
				// db_mongo_api.saveSnapshotPlaylists(req.body.user,snap)
				// 	.then(r =>{
				// 		console.log("snapshotPlaylists finished",r.result);
				// 	})
				done({snap: snap, imap: imap})
			})
	})
}

me.testResolveArtists = function (req, res) {

	//testing: just pull Dan's artists for sample ids
	req.body.guest = {"display_name": "Daniel Niemiec", "id": "123028477"}
	db_mongo_api.fetchStaticUser(req.body.guest)
		.then(r => {
			//testing: payload size
			var payload = r[0].artists.artists.slice(0, 200);
			console.log("payload", payload.length);
			resolver.resolveArtists2(req, payload)
				.then(tuple => {
					//todo: tuple?
					res.send(tuple)

				})
		})

}


me.resolvePlaylists = async function (req, res) {
	let startDate = new Date();

	console.log("resolvePlaylists start time:", startDate);
	//console.log(req.body);
	//todo: requests from UI => just the playlists key is stringified - why?
	//req.body.playlists = JSON.parse(req.body.playlists);
	//console.log("req.body.playlists", req.body.playlists);

	//testing: example output
	//res.send(sample_playlists_resolved);return;

	//testing: skip paging
	//!(shallowTracks) ? shallowTracks = 'skip':{};

	let playlistResult = await
		req.body.spotifyApi.getUserPlaylists(req.body.user.id, {limit: 50})
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(r => {
				return r
			})
	console.log("total playlists length", playlistResult.items.length);
	req.body.playlists = playlistResult.items;

	function matchMadeForYou(i) {
		var pats = [/^Daily Mix/]
		for (var x = 0; x < pats.length; x++) {
			if (pats[x].test(i.name)) {
				//console.log(i.name);
				return true
			}
		}
	}

	//testing:
	// req.body.madeForYou = true;
	//
	// if(req.body.madeForYou){
	// 	console.warn("filtering for madeForYou");
	// 	req.body.playlists = req.body.playlists.filter(i =>{
	// 		return i.owner.id === 'spotify' && matchMadeForYou(i)
	// 	})
	// }

	//testing: madeByYou
	// req.body.madeByYou = true;
	//
	// if(req.body.madeByYou){
	// 	console.warn("filtering for madeByYou");
	// 	req.body.playlists = req.body.playlists.filter(i =>{
	// 		return i.owner.id === req.body.user.id
	// 	})
	// }

	//testing:
	// req.body.collab = true;
	// if(req.body.collab){
	// 	console.warn("filtering for collab");
	//
	// 	req.body.playlists = req.body.playlists.filter(i =>{
	// 		return i.collaborative
	// 	})
	// }


	//r.madeForYou = r.items.length

	//testing: various different methods...

	// console.warn("filter out > 100 songs");
	// req.body.playlists = req.body.playlists.filter(p =>{
	// 	return !(p.tracks.total > 100)
	// })
	//
	// //todo: after this (30) I'm stalling soooomewhere?
	var lim = 3;
	if (lim) {
		console.warn("tested with limited # of playlists:", lim);
		req.body.playlists = req.body.playlists.slice(0, lim);
		req.body.playlists.forEach(p => {
			console.log(p.name + " | " + p.tracks.total)
		})
	}

	//todo: filter out by # of unique artists?
	console.log("resolving playlists:", req.body.playlists.length);
	let resolvedPlaylists = await resolver.resolvePlaylists(req.body)

	//unwind artists from tracks and attach them to each playob
	// resolvedPlaylists.forEach(function (playob) {
	// 	playob.map = {};
	// 	playob.artists = [];
	// 	playob.tracks.forEach(t => {
	// 		t.track.artists.forEach(a => {
	// 			playob.map[a.id] = a;
	// 		})
	// 	})
	// 	for (var key in playob.map) {
	// 		playob.artists.push(playob.map[key])
	// 	}
	// });

	//note: playob profile: {playlist:{},tracks:[],artists:[]}
	//console.log(app.jstr(playobs));


	// var promises = [];
	// resolvedPlaylists.forEach(function (playob) {
	// 	promises.push(db_api.checkDBForArtistGenres(playob, 'artists'))
	// })

	//note: playob profile: {playlist:{},tracks:[],artists:[],payload:[],db:[],lastLook:[]}
	//entries found in the the db will be returned in db, and those that were't go on payload
	//therefore, payload.length + db.length = artists.length

	//feature: depending on length of payload might it be advantangous to return some of that data immediately?
	//right now if the playlist has ANY payload.lengh, we send it on thru


	//console.log("db fulfilled & payloads created ==================================");
	//console.log(playobs.length);

	var resolverPromises = [];
	//set this in memory before we start trying to qualify genres
	//resolverPromises.push(db_api.setFG())

	//var fullyResolvedPlayobs = [];
	resolvedPlaylists.forEach(playob => {

		resolverPromises.push(resolver.resolveTracks(req, playob))
	})

	//console.log("resolverPromises", resolverPromises.length);
	//console.log("fullyResolvedPlayobs", fullyResolvedPlayobs.length);


	Promise.all(resolverPromises).then(resolvedPlaylistsPlaceholder => {
		//console.log(resolvedPlaylists)
		//testing: only use a couple playlists
		//done(resolvedPlayobs);

		//console.log("db population",playobs[0].db.length);
		//returns with a full artist object
		//console.log(playobs[0].db[0]);
		//console.log("spotifyArtists",playobs[1].spotifyArtists.length);
		//console.log(playobs[1].spotifyArtists[1]);

		var pullPromises = [];

		//console.log(app.jstr(playObsWithSpotifyArtists));
		console.log("resolvePlaylists finished execution:", Math.abs(new Date() - startDate) / 600);
		console.log("resolvedPlaylists", resolvedPlaylists.length);
		//feature: sort of abusing this 'playob' idea with this special 'spotifyArtistsResolved' BS
		//if checkDBForArtistGenres could find any genre information for the spotifyArtists we fed it
		//they'll be stored on these playob.db fields - otherwise it'll be in the 'payload' which is just
		//being abused here as normally this 'payload' would get fed elsewhere but here its just a signal
		//that yes indeed we couldn't find anything for them

		var stats = {created: 0, followed: 0, recent: null, oldest: null};

		resolvedPlaylists.forEach(p => {
			//console.log(p.playlist.owner.id);
			p.resolved = [];
			//p.resolved = p.db.concat(p.spotifyArtists)
			p.resolved = p.resolved.concat(p.db);
			p.resolved = p.resolved.concat(p.payload);

			//go thru every track and record the artist into artistFreq w/ a # representing the freq
			//todo: why not just sort the tracks lol? (see getMySavedTracks)
			p.artistFreq = {};
			p.tracks.forEach(t => {
				//most recently modified should only check user created playlists
				if (p.playlist.owner.id === req.body.user.id) {
					//set baselone recent
					stats.recent === null ? stats.recent = {
						playlist_id: p.playlist.id,
						playlist_name: p.playlist.name,
						added_at: new Date(t.added_at)
					} : {};
					stats.oldest === null ? stats.oldest = {
						playlist_id: p.playlist.id,
						playlist_name: p.playlist.name,
						added_at: new Date(t.added_at)
					} : {};
					var d1 = new Date(t.added_at);
					if (stats.recent.added_at < d1) {
						stats.recent = {
							playlist: p.playlist.id,
							playlist_name: p.playlist.name,
							added_at: new Date(t.added_at)
						}
					}
					if (stats.oldest.added_at > d1) {
						stats.oldest = {
							playlist: p.playlist.id,
							playlist_name: p.playlist.name,
							added_at: new Date(t.added_at)
						}
					}
				}
				//todo: only checking the first artist of each track (also, see getMySavedTracks)
				!(p.artistFreq[t.track.artists[0].id]) ? p.artistFreq[t.track.artists[0].id] = 1 : p.artistFreq[t.track.artists[0].id]++;
			});

			//count created
			if (p.playlist.owner.id === req.body.user.id) {
				stats.created = stats.created + 1;
			}

			//go thru every artist and thru all their genres and find each genre's family
			//appends the family name as "familyAgg" which represents it's genres' top distribution over family names


			p.resolved.forEach(a => {
				util.familyFreq(a);
			})
			//p.resolved.forEach(a =>{a.familyAgg?{}:console.log("$",a)})

			// p.payloadResolved.forEach(playob=>{
			// 	p.resolved = p.resolved.concat(playob.db);
			// 	p.resolved = p.resolved.concat(playob.payload);
			// 	//todo: when lastlook is functional
			// 	//p.resolved = p.resolved.concat(playob.lastlook)
			// })
			//p.resolved = p.db.concat(p.payload)
		})

		//followed is just the difference
		stats.followed = resolvedPlaylists.length - stats.created
		console.log(stats);

		//testing: trying to use this to pull favorite artist playlists
		//console.log("adding extra processing step");
		resolvedPlaylists.forEach(p => {
			var apMap = {};
			p.tracks.forEach(t => {
				t.track.artists.forEach(a => {
					!(apMap[a.name]) ? apMap[a.name] = 1 : apMap[a.name] = apMap[a.name] + 1
				})
			});

			for (var key in apMap) {
				if (apMap[key] > 2) {
					//console.log("found a " + key + " focused playlist");
					//console.log(p.playlist.id);
				}
			}

			var arr = [];
			Object.entries(apMap).forEach(tup => {
				var r = {[tup[0]]: tup[1]};
				arr.push(r);
			});

			var sorted = _.orderBy(arr, function (r) {
				return Object.values(r)[0]
			}, 'desc');
			//console.log("$sorted",sorted);

			//todo: going to need to do some math here
			//1) just getting the top value won't do if there are several that are about equal
			//2) if there are several I need to somehow define like a 'relative max' or something?
		});


		res.send({playlists: resolvedPlaylists, stats: stats})
		//res.send(resolvedPlaylists)
	})
	//testing: getUserPlaylists
}
