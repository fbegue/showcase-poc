const fetch = require('node-fetch');
//source: https://blog.bearer.sh/add-retry-to-api-calls-javascript-node/
//spotify docs: https://developer.spotify.com/documentation/web-api/

function fetchRetry(url, options = {}, retries = 3, backoff = 300) {
	const retryCodes = [408, 500, 502, 503, 504, 522, 524]
	const failureCodes = [400,401]
	return fetch(url, options)
		.then(res => {
			if (res.ok) return res.json()
			if (retries > 0 && retryCodes.includes(res.status)) {
				setTimeout(() => {
					//testing: not including 429 in the retryCodes array
					//and instead just handling by itself practically means that
					//you never hit this loop except for an actual error

					//todo: would like to force these errors to see how their handled
					//console.log("retry after",res.headers.get('retry-after'))
					//res.headers.get('retry-after') * 1000
					console.log("backoff*2",backoff*2);
					debugger
					return fetchRetry(url, options, retries - 1, backoff*2) /* 3 */
				}, backoff)
			} else if(failureCodes.includes(res.status)){
				//testing: this is 'expected' behavior on a failure
				//so this shouldn't be caught below - I should just return a response that specified if failed successfullly
				//return {failure:true,url:url}
				return {failure:res,options:options}
			}else {
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
