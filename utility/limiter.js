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
	// maxConcurrent: 10,
	//minTime: 100,
	//testing: at 86~89 it starts failing
	trackDoneStatus: true
});


// var target = 200;
// var mod = 1000
// - 33.51s NO CONFIG,  r* 1000
// - 12.5s | 19.5s - 32s NO CONFIG, r*500

var target = 200;
var mod = 500
limiter.on("failed", async (res, jobInfo) => {
	//todo: realized that res that I PASS here is different than theh one that comes BACK..or something
	try{
		//debugger
		var t = null;
		var uri = null;
		if(!(res.headers)){
			t = res.response.headers['retry-after']
			//uri = res.response.url.replace("https://api.spotify.com/v1","")
		}else{
			res.headers.forEach(function(val, key) { if(key === 'retry-after'){t = val} });
		}

		t = parseInt(t)

		if(jobInfo.args[0].uri){
			uri = jobInfo.args[0].uri.replace("https://api.spotify.com/v1","").slice(0,20)
		}else{
			uri = jobInfo.args[0].replace("https://api.spotify.com/v1","").slice(0,20)
		}

		//
		// const id = jobInfo.options.id || uri
		const id =  uri
		//console.warn(`Job ${id} failed: ${ob.error}`);
		//var r = error.headers['retry-after']
		console.log(`Retrying job ${id} in` + t* mod);
		limiter.updateSettings({minTime:50});
		return  t* mod;
	}catch(e){
	debugger
	}
});
module.exports.limiter =limiter;

var fake =  function(r){
    return new Promise(function(done, fail) {
    done(r)
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

			//console.error(e)
			throw e
		})
}
module.exports.fetchTry =fetchTry;

function fetchHandleRetry(uri,options){
	then(res => {
		if (res.status === 429) {
			res.json()
				.then(r => {
					fail({message: r.error, retryAfter: res.headers.get('retry-after')});
				}, e => {
					debugger
				})
		} else {
			res.json()
				.then(r => {
					done(r)
				})
		}
	}, e => {
		debugger
		return callback({message: e}, null);
	})
}

function fetchRetry(url, options = {}, retries = 3, backoff = 300) {
	const retryCodes = [408, 500, 502, 503, 504, 522, 524,429]
	const failureCodes = [400,401]
	console.log(url);
	return fetch(url, options)
		.then(res => {
			if (res.ok){

				// res.json().then(r =>{
				// 	if(r === undefined){
				// 		debugger
				// 	}
				// 	return r
				// },e=>{
				// 	debugger
				// })
				// return res.json()

					if(res === undefined){
						debugger
				 	}
				return res
			}
			if (retries > 0 && retryCodes.includes(res.status)) {

				setTimeout(() => {
					//testing: not including 429 in the retryCodes array
					//and instead just handling by itself practically means that
					//you never hit this loop except for an actual error

					//todo: would like to force these errors to see how their handled
					//console.log("retry after",res.headers.get('retry-after'))
					//res.headers.get('retry-after') * 1000
					debugger
					console.warn("backoff*2",backoff*2);
					return fetchRetry(url, options, retries - 1, backoff*2) /* 3 */
				}, backoff)
			}
			else if(failureCodes.includes(res.status)){
				//testing: this is 'expected' behavior on a failure
				//so this shouldn't be caught below - I should just return a response that specified if failed successfullly
				//return {failure:true,url:url}
				debugger
				throw {failure:res,options:options}
			}
			//todo: what is this?
			else {
				debugger
				//console.log("retry after",res.headers.get('retry-after'))
				return fetchRetry(url, options, retries - 1, res.headers.get('retry-after'))
			}
		})
		.catch( e=> {
			//note: when returning a promise, if you .then/.catch on it, the 'resolve' and 'reject'
			//are determined by whether you 'return' or 'throw'. hence just returning this error object here
			//would still be resolved at fetchRetry call
			debugger
			console.error(e)
			throw e
		})
}
module.exports.fetchRetry =fetchRetry;


