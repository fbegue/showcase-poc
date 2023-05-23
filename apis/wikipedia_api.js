var rp = require('request-promise');
const cheerio = require('cheerio');
let me = module.exports;


me.getArtistInfoWiki= async function(req,res) {

	try{
		let findArtistArticleResult  = await me.findArtistArticle();
		console.log(findArtistArticleResult);

		let getArticleResult  = await me.getArticle(findArtistArticleResult[0]);
		//res.send(parsedResult.query.search.slice(0,3))

	} catch(e){console.error(e);debugger}

}


me.findArtistArticle = async function(req,res){

	let query = "Queen"
	let queryMods = ["band","artist","group"]
	//let url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=queen&utf8=&format=json"
	let url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query + " " + queryMods[0]}&utf8=&format=json`;

	var options = {
		method: "GET",
		url: url
		// headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
		// form: {
		// 	redirect_uri: clientOrigin ? clientOrigin + "/redirect" : redirectUri,
		// 	grant_type: 'authorization_code',
		// 	code: code
		// },
		// json: true
	};
	console.log(options);



	return rp(options)
		.then(function (result) {
			let parsedResult = JSON.parse(result)
			console.log(parsedResult)
			//res.send(parsedResult.query.search.slice(0,3))

			return parsedResult.query.search.slice(0,3);
	}).catch(function (err) {
		debugger
		console.log(err);
		//fail(err);
	})
}


me.getArticle = async function(article){

	//let pageid = "25180" //queen
	let pageid = article.pageid
	let url = `https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid=${pageid}&prop=text&formatversion=2&redirects=1`

	var options = {
		method: "GET",
		url: url
		// headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
		// form: {
		// 	redirect_uri: clientOrigin ? clientOrigin + "/redirect" : redirectUri,
		// 	grant_type: 'authorization_code',
		// 	code: code
		// },
		// json: true
	};
	console.log(options);

	return rp(options)
		.then(function (result) {
			let parsedResult = JSON.parse(result)

			//todo: didn't spend tooo much time looking, but wasn't able to get the quick info as json fields
			//so going to need cheerio or what have you to process this result

			const $ = cheerio.load(parsedResult.parse.text);
			const infoboxLabels = $('.infobox-label');
			infoboxLabels.each((index, element) => {
				const labelText = $(element).text();
				console.log(labelText);
				debugger
			});

			debugger
			console.log(parsedResult)
			return result

		}).catch(function (err) {
		debugger
		console.log(err.error);
		//fail(err);
	})
}

