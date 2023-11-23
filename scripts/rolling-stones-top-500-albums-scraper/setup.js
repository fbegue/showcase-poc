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

export default albums
