const WordsNinjaPack = require('wordsninja');
const WordsNinja = new WordsNinjaPack();

// var all_genres = require('../example data objects/all_genres').all_genres
//var familyGenre_map = require('./apis/db_api').familyGenre_map;

//split the genre string and detect substrings that:
//1) X match directly on a genre_name
//2) X match directly on a family_name
//3) X match some special inference based on input genre
//4) x match on a partial genre_name (substrings to substring genre_name)

//todo: make WordsNinja load map from DB during db.setInMemory

var me = module.exports;
(async () => {
	await WordsNinja.loadDictionary();
	var genreFam_map = require('../apis/db_api').genreFam_map;
	for(const k in genreFam_map){
		var tarr = k.split(" ")
		tarr.forEach(t => WordsNinja.addWords(t))
	}
	console.log("WordsNinja loaded");
})();

var matchStr =  function(str){
	var genreFam_map = require('../apis/db_api').genreFam_map;
	let words = WordsNinja.splitSentence(str);
	var matches = [];
	words.forEach(w =>{
		//todo: just setting one of possible families for now
		genreFam_map[w] ? matches.push({match:w,family:Object.values(genreFam_map[w])[0],source:"genreDic"}):{}
	})
	return matches
	// return {string:str,matches:matches}
}

var familySynonymMap = {};
familySynonymMap["rap"] = "hip hop";
familySynonymMap["electronic"] = "electro house"
var twoWordFams = ["hip hop","electro house"]
//todo: ehhhh idk
familySynonymMap["indie"] = "rock"
familySynonymMap["americana"] = "rock"
//todo: christian versus gospel - does christian get it's own family?

me.inferGenreFamily =  function(g){
	var familyGenre_map = require('../apis/db_api').familyGenre_map;
	var match = null;
	//split the unknown genre at \s


	//testing: if the genre contains a two-word family name,
	//we won't catch it in the next step which splits on all spaces
	twoWordFams.forEach(f =>{
		if( g.indexOf(f)!== -1) {
			g = g.replace(f, '');
			match= {match: f, family: f, source: "familySynonym"};
		}
	})


	var gkeys = g.split(" ");

	//can we find a family as a substring of the unknown genre?
	gkeys.forEach(k => {
		var keys = Object.keys(familyGenre_map)
		keys.forEach(f => {
			if (k.indexOf(f) !== -1 && (!match)) {
				//todo: return after the first match
				!(match)?match= {match:f,family:f,source:"familySubstring"}:{};
			}
		})
		//otherwise, can we find a family synonynm as a a substring of the unknown genre
		if (!match) {
			var keys2 = Object.keys(familySynonymMap)
			keys2.forEach(f => {
				if (k.indexOf(f) !== -1 && (!match)) {
					//todo: return after the first match
					!(match)?match= {match:f,family:familySynonymMap[k],source:"familySynonym"}:{};
				}
			})
		}
	})

	if(!match){
		var matches = matchStr(g)
		//todo: what if I get multiple families? just 1st for now
		match = matches.length > 0 ? matches[0]:null;
	}

	return match
	// })
}


