
let network_utility = require("../../utility/network_utility");

function simulateAPICall(url) {
	return new Promise((resolve, reject) => {
		const randomDelay = Math.random() * 5000; // Random delay between 0 and 5 seconds (5000 milliseconds)
		setTimeout(() => {
			console.log("url",url)
			resolve(url);
		}, randomDelay);
	});
}
me.archiveBillboardHot100Playlists = async function(req, res) {
	let urls = ["url1","url2","url3","url4","url5","url6","url7","url8","url9","url10","url11","url12","url13","url14","url15"];

	var task = function (url) {
		// return  limiter.schedule(network_utility.fetchTry,options.uri,options)
		return  network_utility.limiter.schedule(simulateAPICall,url)
	}
	let promises = urls.map(task);
	let results = await Promise.all(promises)
	console.log("tasked_results",results)

	// let promises_standard = [];
	// urls.forEach(url =>{
	// 	promises_standard.push(network_utility.limiter.schedule(simulateAPICall,url))
	// 	//promises_standard.push(simulateAPICall.bind(null,url))
	// })
	// let results_standard = await Promise.all(promises_standard)

	let results_standard = await Promise.all(urls.map(url => {
		return simulateAPICall(url).then(url => {
			return url;
		});
	}));
	console.log("results_standard",results_standard)
	debugger;
}
