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


//todo: duplicated from spotify_api.js
//tweaked as async
//todo: doesn't work tho
//don't understand the difference between awaiting spotify_api.pageIt.bind here and .then() below?

me.getUserPlaylistsAsync = async function(req){
    try{
        var r = await req.body.spotifyApi.getUserPlaylists('dacandyman01', {limit: 50})
		debugger
		 var pages = await spotify_api.pageIt.bind(null,req,null,null)
		debugger
		return pages
    } catch(e){
        console.error(e)
		debugger
    }
}

me.getUserPlaylists =  function(req){
    return new Promise(function(done, fail) {
		req.body.spotifyApi.getUserPlaylists('dacandyman01', {limit: 50})
			//this,req,key,skip,data
			.then(spotify_api.pageIt.bind(null, req, null, null))
			.then(function (body) {
				done(body)
			})
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
