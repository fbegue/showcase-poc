var SpotifyWebApi = require('spotify-web-api-node');
var fetchTry = require('../../utility/limiter').fetchTry
var fetchTryAPI = require('../../utility/limiter').fetchTryAPI
var limiter = require('../../utility/limiter').limiter
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

var db_mongo_api = require('../db_mongo_api')
var db_api = require('../db_api.js');
var app = require('../../app')
var resolver = require('../../resolver.js');
var resolver_api = require('../../resolver_api.js');
var songkick_api = require('../songkick_api.js');
var util = require('../../util')
