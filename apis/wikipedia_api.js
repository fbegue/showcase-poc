var rp = require('request-promise');

let findArtistArticle = async function(){

	let url = "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=queen&utf8=&format=json";

	var options = {
		method: "POST",
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

	rp(options).then(function (res) {
		//	console.log("$res",res)
		done(res);
	}).catch(function (err) {
		console.log(err.error);
		fail(err);
	})


}
