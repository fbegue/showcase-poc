//chrome console code

if(false){
	var els = document.querySelectorAll('#video-title');
	var titles = [];
	els.forEach(e =>{
		titles.push(e.getAttribute('title'))
	})
	var albumReviews = titles.slice(30,titles.length)
}


//perform regexes, prettify
//<>

//processing

//var list = require('./theLovedList').list;
var list = require('./classics').list;

var reg1 = /.*-/
var reg2 = /(.*)-(.*)/
var albums = [];
var strings = [];
list.forEach(item =>{
	if(reg1.test(item)){
		var r = reg2.exec(item)

		albums.push({type:"album",artist:r[1].trim(),name:r[2].replace("ALBUM REVIEW","").trim()})
	}
	else{
		strings.push(item)
	}
})

module.exports.albums = albums;


//todo: then you call resolveAlbumStringsToSamplePlaylist
//apis/experimental_api.js
