
//chrome console code

var myRegexp_1 = /(.*),\s'(.*)'/g;
//todo: changed from comma separated when I looked at 200? 9/3/22
//var myRegexp = /(.*),\s.(.*)\W/g;
//to sided quote thing (which they aren't consistent with :/)
//var myRegexp = /(.*),\s‘(.*)’/g;
var myRegexp = /(.*),\s[‘|’](.*)[‘|’]/g;

//testing:
//var myString_1 = "Marvin Gaye, 'What's Going On'";
// var myString_1 = "The Beach Boys, 'Pet Sounds'";
// var match = myRegexp_1.exec(myString_1);
//testing:
//var myString = George Michael, ‘Faith’
// var match = myRegexp.exec(myString);
//console.log(match)

//url: https://www.rollingstone.com/music/music-lists/best-albums-of-all-time-1062063/jay-z-the-blueprint-3-1063183/

var albums = []
var h2 = document.querySelectorAll(".c-gallery-vertical-album__title")
//console.log(h2.length)
h2.forEach(h => {
	console.log(h.textContent);
	var match = null;
	match = new RegExp(myRegexp).exec(h.textContent);
	// console.log(match)
	match? albums.push({artist:match[1],name:match[2],type:"album"}) : console.log('no match',h.textContent)
})

//todo: create a js export of this albums object
console.log("albums",albums)
