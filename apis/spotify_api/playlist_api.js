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

var fetchTry = require('../../utility/limiter').fetchTry
var fetchTryAPI = require('../../utility/limiter').fetchTryAPI
var limiter = require('../../utility/limiter').limiter

var db_mongo_api = require('../db_mongo_api')
var db_api = require('../db_api.js');
var app = require('../../app')
var resolver = require('../../resolver.js');
var resolver_api = require('../../resolver_api.js');
var songkick_api = require('../songkick_api.js');
var util = require('../../util')

var spotify_api = require('../spotify_api')


var me = module.exports;

//todo: duplicated from spotify_api.js
//tweaked as async

me.getUserPlaylists = async function(req){
    try{
        var r = await req.body.spotifyApi.getUserPlaylists('dacandyman01', {limit: 50})
		debugger
		var pages = await spotify_api.pageIt.bind(null,req,null)
		debugger
		return pages
    } catch(e){
        console.error(e)
		debugger
    }
}

me.unfollowMany = async function(req){
    try{
		var plays = await me.getUserPlaylists(req)
		debugger
    } catch(e){
        console.error(e)
    }
}

me.unfollowPlaylist = async function(req){
	try{
		var r = req.body.spotifyApi.unfollowPlaylist(req.body.id)
	} catch(e){
		console.error(e)
	}
}

