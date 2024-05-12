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
var Bottleneck = require("bottleneck");

var fetchTry = require('../../utility/network_utility').fetchTry
var fetchTryAPI = require('../../utility/network_utility').fetchTryAPI
let network_utility =  require('../../utility/network_utility')
var limiter = require('../../utility/network_utility').limiter

var db_mongo_api = require('../db_mongo_api')
var db_api = require('../db_api.js');
var app = require('../../app')
var resolver = require('../../resolver.js');
var resolver_api = require('../../resolver_api.js');
var songkick_api = require('../songkick_api.js');
var util = require('../../util')

var spotify_api = require('../spotify_api')

var me = module.exports;


//todo: trying to switch to async, but doesn't work tho
//don't understand the difference between awaiting spotify_api.pageIt.bind here and .then() below?

var getUserPlaylistsAsync = async function(req){
    try{
        var r = await req.body.spotifyApi.getUserPlaylists('dacandyman01', {limit: 50})
		debugger
		 var pages = await network_utility.pageIt.bind(null,req,null,null)
		debugger
		return pages
    } catch(e){
        console.error(e)
		debugger
    }
}

me._getUserPlaylists = function(req){
    return new Promise(function(done, fail) {
		// todo: hardcoded user name (replace after being sure this doesn't break UI)
		let userId = "dacandyman01"

		if(req.body.userId){
			userId = req.body.userId
		}
		req.body.spotifyApi.getUserPlaylists(userId, {limit: 50})
			//this,req,key,skip,data
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(function (body) {done(body)})
	})
}

me.getUserPlaylists = function (req, res) {
	_getUserPlaylists(req)
		.then(r => {res.send(r)})
		.catch(e => {
			res.status(500).send(e)
		})
}

//todo: updated unfollowPlaylist
me.unfollowMany = async function(req){
	try{
		var body1 = await me.getUserPlaylists(req)
		var blame = body1.items.filter(r => r.name === "Columbus-Weekly")
		blame = blame.map(p => p.id)
		//blame = blame.slice(0,blame.length/2)
		//var blame2 = blame.slice(0,2)

		var task = async function (playid) {
			try{
				var response = await limiter.schedule(me.unfollowPlaylist,req,playid)

				return response;
			}catch(e){
				debugger
			}
		}
		var proms = blame.map(task);
		var mresults = await Promise.all(proms)
		debugger
	} catch(e){
		debugger
		console.error(e)
	}
}

me.unfollowPlaylist = async function(req){
	try{
		//todo: was getting some kind of bad-gateway when I would try n number of these?
		//id = "2pLwtgs1CEYAMcUyP2enWt"
		var r = await req.body.spotifyApi.unfollowPlaylist(req.body.playlistId)
		return r
	} catch(e){
		debugger
		console.error(e)
	}
}

me.removeTracksFromPlaylist = async function(req){
	try{
		// Remove all occurrence of a track
		var tracks = [{ uri : "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" }];
		var playlistId = '5ieJqeLJjjI8iJWaxeBLuK';
		var options = { snapshot_id : "0wD+DKCUxiSR/WY8lF3fiCTb7Z8X4ifTUtqn8rO82O4Mvi5wsX8BsLj7IbIpLVM9" };

		var r = await  req.body.spotifyApi.removeTracksFromPlaylist(playlistId, tracks, options)
		return r
	} catch(e){
		debugger
		console.error(e)
	}
}

me.getPlaylist = async function(req,playlistId){
	try{
		//testing:
		//playlistId = "2e9jTTS04siHRLe9iveuOw"
		let r = await req.body.spotifyApi.getPlaylist(playlistId);
		return r.body
	} catch(e){
		debugger
		console.error(e)
	}
}

me.getPlaylistTracks = async function(req,playlistId){
	try{
		//testing:
		//playlistId = "2e9jTTS04siHRLe9iveuOw"

		return await req.body.spotifyApi.getPlaylistTracks(playlistId)
			.then(network_utility.pageIt.bind(null, req, null, null))
			.then(pagedRes => {
				return pagedRes.items
			})
	} catch(e){
		debugger
		console.error(e)
	}
}
