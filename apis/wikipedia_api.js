var rp = require('request-promise');
const cheerio = require('cheerio');
const {limiter} = require("../utility/network_utility");
let me = module.exports;

me.getArtistInfoWiki= async function(req) {

	try{
		let findArtistArticleResult  = await me.findArtistArticle(req.body.artistQuery);
		if(findArtistArticleResult.length && findArtistArticleResult.length > 0){
			//let getArtistInfoResult  = await me.getArticle(findArtistArticleResult[0]);
			console.log(findArtistArticleResult);


			var task = function (r) {
				return me.parseArticle(r)
			}
			var ps = findArtistArticleResult.map(task);
			let parseArticleResults = await Promise.all(ps);
			//console.log(parseArticleResults);

			function getFirstWithMostNonNullFields(parseArticleResults) {
				let maxNonNullCount = -1;
				let resultWithMostNonNullFields = null;

				parseArticleResults.forEach((result) => {
					// Count the non-null fields in the current result
					const nonNullCount = Object.values(result).filter(value => value !== null && value !== undefined).length;

					// If the current result has more non-null fields, update the result
					if (nonNullCount > maxNonNullCount) {
						maxNonNullCount = nonNullCount;
						resultWithMostNonNullFields = result;
					}
				});

				return resultWithMostNonNullFields;
			}
			let bestInfo = getFirstWithMostNonNullFields(parseArticleResults)

			return {artistInfo:bestInfo,artistQuery:req.body.artistQuery}
		}
		else{
			return {artistInfo:null,artistQuery:req.body.artistQuery}
			//res.send({artistInfo:null,artistQuery:req.body.artistQuery})
		}
	} catch(e){console.error(e);debugger}
}

me.findArtistArticle = async function(query){
	let queryMods = ["band","artist","group"]
	//let url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=queen&utf8=&format=json"

	//todo: testin different query modifications to target artist profiles
	//this was appropriate for "Queen" for example but not for "Kanye West" or "Kendrick Lamar"
	//let url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query + " " + queryMods[0]}&utf8=&format=json`;

	//todo: I do need to except special characters tho (ex artist name: https://open.spotify.com/artist/4xPQFgDA5M2xa0ZGo5iIsv?si=Bny8HRyYQPCmlUhR9wGn7g
	//note: strangely ... you don't need to url-encode the search query??

	let url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`;

	var options = {
		method: "GET",
		url: url
	};
	console.log(options);

	return rp(options)
		.then(function (result) {
			let parsedResult = JSON.parse(result)
			console.log(parsedResult)
			const parsedResult_short = parsedResult.query.search.map(item => ({
				title: item.title,
				pageid: item.pageid
			}));
			//just taking first 3 results
			return parsedResult_short.slice(0,3);
	}).catch(function (err) {
		debugger
		console.error(err);	throw(err);
	})
}

me.parseArticle = async function(article){

	let pageid = article.pageid
	let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid=${pageid}&prop=text&formatversion=2&redirects=1`
	var options = {
		method: "GET",
		url: url
	};

	console.log(options.url);
	return rp(options)
		.then(function (result) {
			let parsedResult = JSON.parse(result)
			//todo: didn't spend tooo much time looking, but wasn't able to get the quick info as json fields

			const $ = cheerio.load(parsedResult.parse.text);
			const infoboxLabels = $('.infobox-label');
			const infoboxDatas = $('.infobox-data');
			let artistInfo = {genres:null,origin:null,active:null};

			infoboxLabels.each((index, element) => {
				const labelText = $(element).text();
				const labelContent = $(infoboxDatas[index])
				//console.log(labelText)

				if(labelText === "Genres"){
					artistInfo.genres = [];
					//const childrenArray = $(labelContent[0]?.children[1]?.children[1]?.children).toArray();
					let childrenArray;
					if (labelContent[0] && labelContent[0].children && labelContent[0].children[1] && labelContent[0].children[1].children && labelContent[0].children[1].children[1] && labelContent[0].children[1].children[1].children) {
						childrenArray = $(labelContent[0].children[1].children[1].children).toArray();
					}
					//const childrenArray2 = $(labelContent[0]?.children[1].children[0].children).toArray();
					let childrenArray2;
					if (labelContent[0] && labelContent[0].children && labelContent[0].children[1] && labelContent[0].children[1].children && labelContent[0].children[1].children[0] && labelContent[0].children[1].children[0].children) {
						childrenArray2 = $(labelContent[0].children[1].children[0].children).toArray();
					}

					const childrenArray3 = $(labelContent[0]?.children).toArray();



					//testing: kendrick lamar, kanye west
					if(childrenArray?.length > 0){
						childrenArray.forEach((element, index) => {

							// testing: thought this looks like "element, text (\n), ....
							// but is inconsistent maybe?
							// if (index % 2 === 0) { // This condition checks for even indices (0, 2, 4, ...)

							if(!element.children){

							}
							else{
								console.log($(element?.children[0]).text())
								let g = $(element.children[0]).text()
								artistInfo.genres.push(g)
							}
						})
					}
					//testing: kids see ghosts
					else if(childrenArray2?.length > 0){
						debugger
						childrenArray2.forEach((element, index) => {
							// this looks like "element,element..
							console.log($(element.children[0]).text())
							let g = $(element.children[0]).text()
							artistInfo.genres.push(g)
						})
					}
					else if(childrenArray3?.length > 0){
						childrenArray3.forEach((element, index) => {
							// this looks like "text,element,..
							let t = $(element).text();
							let regex = new RegExp('^[a-zA-Z\\s&\'-]+$', 'g');// Matches a string of one or more letters
							const result = regex.test(t);
							if(result){
								let g = $(element).text()
								artistInfo.genres.push(g)
							}
						})
					}
					else{
						console.error("found 'Genres' infobox, but couldn't parse genres")
						debugger
					}
				}
				//testing: Between the buried and me
				if(labelText === "Origin"){
					artistInfo.origin = $(infoboxDatas[index]).text();
				}
				if(labelText === "Years active"){
					artistInfo.active = $(infoboxDatas[index]).text();
				}
				if(labelText === "Born"){

					//testing: amy winehouse
					//todo: is it always index 5 or should I search for 'birthplace' tag?
					let birthplace  = null;
					if(infoboxDatas[index].children && infoboxDatas[index].children.length === 6){
						birthplace  = $(infoboxDatas[index].children[5]).text()
					}

					//testing:  kendrick lamar, kanye west
					function parseHometown(bornField) {
						// Regex to match the birthdate and age, and capture the hometown part
						const regex = /\(\d{4}-\d{2}-\d{2}\)\s*\w+\s*\d{1,2},\s*\d{4}\s*\(age\s*\d+\)\s*(.*)$/;
						const match = bornField.trim().match(regex);

						if (match && match[1]) {
							return match[1].trim();  // Return the hometown, trimming any extra spaces
						}
						return null;  // If no match, return null
					}

					if(birthplace){
						debugger
						artistInfo.born =birthplace
					}
					else{
						let text = $(infoboxDatas[index]).text();
						let pht = parseHometown($(infoboxDatas[index]).text());
						if(pht){
							artistInfo.born =parseHometown($(infoboxDatas[index]).text());
						}
						else{
							console.error("found 'Born' infobox, but couldn't parse hometown from: ", text)
						}
					}

				}
			});
			return artistInfo

		}).catch(function (err) {
			debugger
			console.error(err.error);throw(err.error);
	})
}

