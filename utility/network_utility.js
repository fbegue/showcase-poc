const fetch = require('node-fetch');
var Bottleneck = require("bottleneck");

//const resolver_api = require('../resolver_api')
//source: https://blog.bearer.sh/add-retry-to-api-calls-javascript-node/
//spotify docs: https://developer.spotify.com/documentation/web-api/



//todo: surely the fastest way is to let us burst and then
//react to the first failure by adjusting the settings right?

//todo: b/c we're working on a thirty second window (my quota /30s, I do not know)
//testin here can be tricky b/c unless you let the whole quota reset,
//results will obviously vary... anything I've recorded below is: 1ST | 2ND run in a row

//so all that together means that the limiter needs to understand how bad the quota is when
//it begins executing jobs and react to that?

//because the goal is to MINIMIZE retry wait period I guess?
//but WHEN QUOTA IS HIGH does the strategy matter at all?
//what about average total # of jobs?
//what about multiple processes trying to use it at same time?


//docs:
//https://github.com/SGrondin/bottleneck
var limiter = new Bottleneck({
	//maxConcurrent: 1,
	minTime: 100,
	trackDoneStatus: true
});




// var target = 200;
// var mod = 1000
// - 33.51s NO CONFIG,  r* 1000
// - 12.5s | 19.5s - 32s NO CONFIG, r*500

var target = 200;
var mod = 50;

limiter.on("failed", async (res, jobInfo) => {

	debugger
	//todo: realized that res that I PASS here is different than theh one that comes BACK..or something
	try{
		console.log({message:res.message,uri:res?.options?.uri || "n/a"});
		//default retry time
		var t = 10;
		var uri = null;
		if(!(res.headers)){
			if(res.response){
				t = res.response.headers['retry-after']
			}

			//uri = res.response.url.replace("https://api.spotify.com/v1","")
		}else{
			res.headers.forEach(function(val, key) { if(key === 'retry-after'){t = val} });
		}

		t = parseInt(t)


		//todo: was playing around with assigning id in-flight
		//but this should really be done when calling schedule

		if(jobInfo.args[0].uri) {
			uri = jobInfo.args[0].uri.replace("https://api.spotify.com/v1", "").slice(0, 20)
		}else if(jobInfo.args[0].url){
				uri = jobInfo.args[0].url
		}else if(typeof jobInfo.args[0] === 'string'){
			uri = jobInfo.args[0].replace("https://api.spotify.com/v1","").slice(0,20)
		}else{
			uri = jobInfo.args[0].url
		}

		//const id = jobInfo.options.id || uri;
		const id =  uri

		//console.warn(`Job ${id} failed: ${ob.error}`);
		//var r = error.headers['retry-after']
		console.log(`Retrying job "${id}" in ` + t* mod);
		limiter.updateSettings({minTime:50});
		return  t* mod;
	}catch(e){
	debugger
	}
});

//testing: log different stages of request fulfillment

// limiter.on("debug", async (message, data) => {
//
// 	let donemsg ="Event triggered: done"
// 	try{
// 		if(message === donemsg){
// 			//console.log(message);
//
// 			// let songkickArtist_name = data[0]?.args[0]?.body?.artist?.name;
// 			// console.log(`done: ${songkickArtist_name}`);
//
// 			let id = data[0]?.options.id;
// 			console.log(`${donemsg} : ${id}`);
//
// 		}
// 	}catch(e){
// 		debugger
// 	}
// });

var fake =  function(r){
    return new Promise(function(done, fail) {
    done(r)
    })
}

var me = module.exports;
me.limiter = limiter;
me.limiter_get_all_pages = new Bottleneck({
	maxConcurrent: 1,
	//minTime: 100,
	trackDoneStatus: true
});


//the node api i'm using, although very limited and unfinished it seems like its the best out there...
//https://github.com/thelinmichael/spotify-web-api-node

//thought about using 'bind' to pass the initial func and call it here
//but works a little differently with spotifyApi which I can't control insides of
//this.getAccessToken is not a function

//instead ended up with this pageIt wrapper which didn't go exactly as planned
//because of some response format weirdness but its still nice :)
//getFollowedArtists is example of weirdness, and its the reason I must pass a key

/**pageIt
 * Paging using manually calculated offsets
 * @param key Is now the singular known (artist NOT artists)
 * @param skip shallow_<type> is passed here - if non-null, skip
 *        also sometimes used to force skipping when testin smaller subsets
 * */

//params when called: this,req,key,skip,data
var pageIt =  function(req,key,skip,data){
	return new Promise(function(done, fail) {
		if(skip){
			done(data.body)
		}else{
			if(!(data)){data=key;key=null;}
			if(data.body.next){
				console.log("pageIt",data.body.next);
				//console.log("key",key);
				me.getPages(req,data.body,key)
					.then(pages =>{

						//testing: while fixing a bug, forgot I made it so getPages only gets every page after the 1st?
						//and then I recombine below? fuck that anyways

						data.body.items = [];

						pages.forEach(p =>{
							if(key){
								data.body.items = data.body.items.concat(p[key + "s"].items)
							}else{
								data.body.items = data.body.items.concat(p.items)
							}
						})
						data.body.pagedTotal = data.body.items.length;
						console.log("pageIt finished");
						done(data.body)
					})
					.catch(e =>
					{
						debugger;
						console.error(e)})
			}else{done(data.body)}
		}
	})
}
me.pageIt = pageIt;

//todo: something off with my 'totals'
var preserve = null;

/**pageItAfter
 * For endpoints that use 'next' (as opposed to offset)
 *
 * */

var pageItAfter =  function(key,pages,req,data){
	return new Promise(function(done, fail) {
		//what does this binding thing mean again?
		//console.log(data);
		preserve === null? preserve= JSON.parse(JSON.stringify(data.body)):{};
		if(!(data)){data=key;key=null;}
		if(data.body.next){
			//console.log("pageItAfter",data.body.next);

			//console.log("key",key);
			me.getPage(data.body,key,req)
				.then(r =>{
					pages.push(r)
					if(r.artists.next){
						debugger
						pageItAfter('',pages,req,{body:{next:r.artists.next}}).then(done).catch(fail)
					}
					else{
						//get the original result
						//console.log(preserve);
						var body = {items:preserve.artists.items}
						pages.forEach(p =>{
							body.items =  body.items.concat(p.artists.items)
						})
						preserve =null
						done(body);
					}
				})
				.catch(e => console.error(e))
		}else{
			preserve = null
			done(data.body)}
	})
}
me.pageItAfter = pageItAfter;


//todo: made this non-configuraable b/c I'm so confused as to why this changed?
//maybe I'm just being dumb but...
me.getPage = function(body,key,req){
	return new Promise(function(done, fail) {

		var re = /.*\?/;
		//todo: with key
		var reAfter = /.*\?type=artist&limit=50&after=(.*)/;
		var reRes =  re.exec(body.next);
		var baseUrl = reRes[0]; //not an array
		var reAfterRes =  reAfter.exec(body.next);

		var after = reAfterRes[1];//not an array
		var q1 = 'offset=';var q2 = '&limit=50';

		//todo: with key
		//baseUrl = baseUrl + "type=" + key + "&"}
		baseUrl = baseUrl + "type=artist&after=" + after + "&limit=50"
		//console.log("baseUrl",baseUrl);
		let options = {uri:baseUrl,headers: {"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()}, json: true};
		me.fetchTry(options.uri,options)
			.then(r =>{
				done(r);
			},e =>{
				fail(e);
			})

	})
}

me.getPages = function(req,body,key){
	return new Promise(function(done, fail) {

		var re = /.*\?/;var reRes =  re.exec(body.next);
		var baseUrl = reRes[0]; //not an array

		var q1 = 'offset=';var q2 = '&limit=50';

		//todo: may have to adjust how I do parse this
		if(key){baseUrl = baseUrl + "type=" + key + "&"}
		console.log("baseUrl",baseUrl);

		let options = {uri:baseUrl,headers: {"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()}, json: true};
		var num = Math.ceil(body.total / 50)
		console.log("total",body.total);

		//console.log("scheduled",num);
		var promises = [];

		options.uri = baseUrl + q1 + 0 + q2
		var ops = [];
		ops.push(JSON.parse(JSON.stringify(options)))

		for(var x=1; x<= num;x++){

			options.uri = baseUrl + q1 + 50*x + q2
			ops.push(JSON.parse(JSON.stringify(options)))

			// function get(x,options){
			// 	options.uri = baseUrl + q1 + 50*x + q2
			// 	//console.log(options.uri);
			// 	return fetchTry(options.uri,options);
			// }
		}

		var task = function (options) {
			return  limiter.schedule(me.fetchTry,options.uri,options)
		}
		promises = ops.map(task);
		//note: something about rp doesn't work the way I thought it would
		//promises.push(limiterSpotify.schedule(get(options)));
		//promises.push(limiterSpotify.schedule(get,x,options));

		Promise.all(promises).then(r => {
			//console.log('here');
			done(r);
		},err =>{
			debugger
			console.error(err.error)
			// fail(err)
		})
	})
}


function fetchTry(url, options = {}, retries = 3, backoff = 300) {
	const retryCodes = [408, 500, 502, 503, 504, 522, 524,429]
	const failureCodes = [400,401]
	console.log(url);

	return fetch(url, options)
		.then(res => {
			//debugger
			if (res.ok){
				return res.json()
					.then(r =>{
						if(r === undefined){
							debugger
						}
						return r} )
				//return res.json()
			}
			else{
				//note: just throwing out to catch
				throw res
				// //testing: was carefully parsing failure from here?
				// return res.json()
				// 	.then(r =>{
				// 		debugger
				// 		var thrown = {time:t,error:r.error}
				// 		throw(thrown)
				// 	},e =>{
				// 		debugger
				// 	})
			}
		})
		.catch( e=> {

			console.error(e)
			debugger
			throw e
		})
}
me.fetchTry = fetchTry;

function fetchTryAPI(callback, req,arg, retries = 3, backoff = 300) {
	const retryCodes = [408, 500, 502, 503, 504, 522, 524,429]
	const failureCodes = [400,401]
	//console.log(url);
	return callback(arg)
		.then(res => {
			//debugger
			if (res.ok){
				return res.json()
					.then(r =>{
						if(r === undefined){
							debugger
						}
						return r} )
				//return res.json()
			}
			else{
				//note: just throwing out to catch
				throw res
				// //testing: was carefully parsing failure from here?
				// return res.json()
				// 	.then(r =>{
				// 		debugger
				// 		var thrown = {time:t,error:r.error}
				// 		throw(thrown)
				// 	},e =>{
				// 		debugger
				// 	})
			}
		})
		.catch( e=> {
			//console.error(e)
			throw e
		})
}
me.fetchTryAPI =fetchTryAPI;

//todo: abandoned attempts?

// function fetchHandleRetry(uri,options){
// 	then(res => {
// 		if (res.status === 429) {
// 			res.json()
// 				.then(r => {
// 					fail({message: r.error, retryAfter: res.headers.get('retry-after')});
// 				}, e => {
// 					debugger
// 				})
// 		} else {
// 			res.json()
// 				.then(r => {
// 					done(r)
// 				})
// 		}
// 	}, e => {
// 		debugger
// 		return callback({message: e}, null);
// 	})
// }

// function fetchRetry(url, options = {}, retries = 3, backoff = 300) {
// 	const retryCodes = [408, 500, 502, 503, 504, 522, 524,429]
// 	const failureCodes = [400,401]
// 	console.log(url);
// 	return fetch(url, options)
// 		.then(res => {
// 			if (res.ok){
//
// 				// res.json().then(r =>{
// 				// 	if(r === undefined){
// 				// 		debugger
// 				// 	}
// 				// 	return r
// 				// },e=>{
// 				// 	debugger
// 				// })
// 				// return res.json()
//
// 					if(res === undefined){
// 						debugger
// 				 	}
// 				return res
// 			}
// 			if (retries > 0 && retryCodes.includes(res.status)) {
//
// 				setTimeout(() => {
// 					//testing: not including 429 in the retryCodes array
// 					//and instead just handling by itself practically means that
// 					//you never hit this loop except for an actual error
//
// 					//todo: would like to force these errors to see how their handled
// 					//console.log("retry after",res.headers.get('retry-after'))
// 					//res.headers.get('retry-after') * 1000
// 					debugger
// 					console.warn("backoff*2",backoff*2);
// 					return fetchRetry(url, options, retries - 1, backoff*2) /* 3 */
// 				}, backoff)
// 			}
// 			else if(failureCodes.includes(res.status)){
// 				//testing: this is 'expected' behavior on a failure
// 				//so this shouldn't be caught below - I should just return a response that specified if failed successfullly
// 				//return {failure:true,url:url}
// 				debugger
// 				throw {failure:res,options:options}
// 			}
// 			//todo: what is this?
// 			else {
// 				debugger
// 				//console.log("retry after",res.headers.get('retry-after'))
// 				return fetchRetry(url, options, retries - 1, res.headers.get('retry-after'))
// 			}
// 		})
// 		.catch( e=> {
// 			//note: when returning a promise, if you .then/.catch on it, the 'resolve' and 'reject'
// 			//are determined by whether you 'return' or 'throw'. hence just returning this error object here
// 			//would still be resolved at fetchRetry call
// 			debugger
// 			console.error(e)
// 			throw e
// 		})
// }
// me.fetchRetry =fetchRetry;

/**
 * getAllPages
 * @param request - A call to spotifyApi which returns body.next
 * @param req
 * @returns {Promise<*>}
 */
me.getAllPages = async function(request,req){
	const paginatedResponse = await request;

	let currentResponse = paginatedResponse;
	while (currentResponse.body.next) {
		let options = {
			uri: currentResponse.body.next,
			headers: {"Authorization":'Bearer ' + req.body.spotifyApi.getAccessToken()},
			json: true
		};
		currentResponse = await limiter.schedule(me.fetchTry,options.uri,options)
		// currentResponse = await me.fetchTry(options.uri,options)
		//note: remapping so it looks like the first query
		currentResponse = {body:currentResponse,headers:options.headers}
		// currentResponse = await req.body.spotifyApi.getGeneric(currentResponse.body.next)
		paginatedResponse.body.items = paginatedResponse.body.items.concat(currentResponse.body.items);
	}
	return paginatedResponse;
};


