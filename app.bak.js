/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 *
 * sourced from:
 * https://github.com/spotify/web-api-auth-examples
 *
 * locate auth info @:
 * https://developer.spotify.com/my-applications
 *
 *
 */

const awsServerlessExpress = require('aws-serverless-express');
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

var express = require('express'); // Express web server framework
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
var os = require("os");
const runMiddleware = require('run-middleware');
runMiddleware(app);
module.exports.app = app;

var spotify_api = require('./apis/spotify_api.js');
var db_mongo_api = require('./apis/db_mongo_api.js');
var songkick_api = require('./apis/songkick_api.js');
var testSuite = require('./testing/suite')
var  db_api = require('./apis/db_api.js');
var experimental_api = require('./apis/experimental_api');
var playlist_api = require('./apis/spotify_api/playlist_api')
var wikipedia_api = require('./apis/wikipedia_api.js')
var ltest = require('./utility/limiterTest').test
var  db = require('./db.js');
var  db_seed = require('./db_seed.js');
var matcher = require("./utility/matcher")

// setTimeout(e =>{
// 	var t1 = matcher.inferGenreFamily("bubblegrunge")
// 	var t2 = matcher.inferGenreFamily("bubblerock")
// 	var t3 = matcher.inferGenreFamily("hippie rap")

//todo: noticed that BRUTAL DEATHCORE exists in all_genres but not DEATHCORE
//modify matchStr to also split all genres too? hmmm

//var t4 = matcher.inferGenreFamily("deathcore")
// 	debugger;
// },2000)


//=================================================
//express features

//allow cors requests from localhost (same origin)
//app.use(cors());

//testing: responds to options preflight
//from single origin
// app.use(cors({
// 	// origin: 'https://master.d267e964bph18g.amplifyapp.com',
//
// 	//reflect req.header's origin
// 	origin:true
// 	//delete
// 	// methods: ['GET','POST','UPDATE','PUT','PATCH','OPTIONS']
// }));


//testing: by itself = doesn't handle options maybe???
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
	next();
});


//otherwise can't read Fetch API's json-stringified body
app.use(bodyParser.json({
	inflate: false,
	limit: "50mb"
}));

//I believe this is parsing for a url-encoded request?.
app.use(bodyParser.urlencoded({
	extended: true,
	limit: "50mb"
}));

app.use(awsServerlessExpressMiddleware.eventContext())


app.use(function (req, res, next) {


	//so this guy should create it's own instance of my spotify api object using the client creds
	//and then any request should just look at its req to find their specific api creded object

	//prevent init getAuth + pre-flight for normal fetches from using middleware
	if(req.url === '/getAuth' || req.method === 'OPTIONS') {
		next()
	}else{
		// console.log("auth middleware route: " + req.url);
		// console.log("origin: " + req.headers.origin);

		//note: set clientOrigin as redirect (for consistency, value shouldn't be read)
		//note: when testin' for postman, got to send 'req.body.authFake'
		req.body.auth ? set(req.headers.origin) : setFake( req.headers.origin)
		//req.body.auth ? set() : setFake()
	}
	//console.log(req.headers);

	function set(){
		//console.log("set passing:",req.headers.origin);
		spotify_api.getSpotifyWebApi(req.headers.origin)
			.then(api =>{
				api.setAccessToken(req.body.auth.access_token);
				api.setRefreshToken(req.body.auth.refresh_token);

				req.body.spotifyApi =api;
				req.body.user = req.body.auth.user
				//console.log("auth middleware used",req.body.auth.user.display_name);
				next()
			}).catch(e =>{
			console.error("set error",e); next();
		})
	}
	function setFake(){
		//console.error("faking auth middleware");

		spotify_api.getCheatyToken(req.headers.origin)
			.then(api =>{

				//already set by cheaty
				//api.setAccessToken(req.body.auth.access_token);

				//and the whole point is that I'm abusing the refresh
				//api.setRefreshToken(req.body.auth.refresh_token);
				req.body.spotifyApi = api;
				//testing: just me for now
				//req.body.user = {id:"dacandyman01",display_name:"Franky Begue"}
				req.body.spotifyApi.getMe()
					.then(c => {
						req.body.user = {display_name: c.body.display_name, id: c.body.id.toString()}
						//console.log("setFake to:",req.body.user.display_name + " | " + req.body.user.id);
						next()
					}).catch(e => {
					console.error("setFake error", e);
					next()
				})
			})}

})

var port = 8888;

console.log('Listening on ' + port);
app.listen(port);



//=================================================
//register routes

for(var key in spotify_api) {
	if(spotify_api[key] instanceof Function && key.charAt(0) !== '_') {
		console.log("spotify_api/" + key);
		app.post("/" + key, spotify_api[key]);
	}
}

for(var key in songkick_api) {
	if(songkick_api[key] instanceof Function  && key.charAt(0) !== '_') {
		console.log("songkick_api/" + key);
		app.post("/" + key, songkick_api[key]);
	}
}

for(var key in experimental_api) {
	if(experimental_api[key] instanceof Function  && key.charAt(0) !== '_') {
		console.log("experimental_api/" + key);
		app.post("/" + key, experimental_api[key]);
	}
}

for(var key in playlist_api) {

	if(playlist_api[key] instanceof Function && key.charAt(0) !== '_') {
		console.log("playlist_api/" + key);
		app.post("/" + key, playlist_api[key]);
	}
}

for(var key in testSuite) {
	if(testSuite[key] instanceof Function  && key.charAt(0) !== '_') {
		console.log("testSuite/" + key);
		app.post("/" + key, testSuite[key]);
	}
}

for(var key in wikipedia_api) {

	if(wikipedia_api[key] instanceof Function  && key.charAt(0) !== '_') {
		console.log("wikipedia_api/" + key);
		app.post("/" + key, wikipedia_api[key]);
	}
}

//=================================================
//utility setup

var jstr = function(ob){
	return JSON.stringify(ob,null,4)
}

const colors = require('colors/safe');
console.error = function(msg,ob){

	if(os.hostname() === "DESKTOP-TMB4Q31" && msg === "Missing x-apigateway-event or x-apigateway-context header(s)"){
		//note: disable these gateway warnings when running locally
	}else{
		console.log(colors.red(msg),ob?ob:null)};
	}
console.warn = function(msg){console.log(colors.yellow(msg))};
console.good = function(msg){console.log(colors.green(msg))};

//console.log("colors configured");

//todo: at some point I tried to setup line # output but idk what happened to that
//console.info("console.info configured with line output");

module.exports.jstr = jstr;
module.exports.console = console;


//================================
//db seeding

//todo: times out on insertStaticGenres
app.post('/api/insertStatic', (req, res) => {
	//db_seed.insertSpotifyUsers()
	 db_seed.insertStatic()
		.then(r =>{
			console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});

});

//================================
//db connections and tests

app.get('/api/info', (req, res) => {
	const packageJSON = require(`./package.json`);

	res.send({ application: packageJSON.name, version: packageJSON.version });
});




var package = require("./package.json")
app.post('/api/postinfo', (req, res) => {
	console.log("postinfo...",req.body );
	//testing: not going to do anything if I'm using cors middleware above
	//  res.header("Access-Control-Allow-Origin", "https://master.d267e964bph18g.amplifyapp.com");
	// res.header("Access-Control-Allow-Headers", "*");
	// res.header("Access-Control-Allow-Methods", "OPTIONS,POST,GET");
	res.send({ application: 'soundfound', version: package.version,body:req.body });
});


app.post('/api/testlimit', (req, res) => {
	var start = Date.now()
	ltest(req)
		.then(r =>{
			//console.log(r)
			console.log("finished",Math.abs(new Date() - start) / 600);
			debugger
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

//testing:
// db_mongo_api.clientAtlas()
// 	.then(r =>{
// 		console.log("db_mongo_api.setup complete");
//
// 	},e =>{console.log("db_mongo_api.setup failure",e);})

// db.clientAtlasProm
// 	.then(clientAtlas =>{
// 		var dbo = clientAtlas.db("soundfound");
// 		dbo.collection('users').find({}).toArray().then(r2 =>{
// 			console.log("clientAtlasProm",r2.length);
// 		})
// 	})

//========================================================
//mongo fuckery

app.post('/api/testFetchUser', (req, res) => {

	db_mongo_api.fetchUser("dacandyman01")
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

// app.post('/api/testAtlasConnect', (req, res) => {
//
// 	db.connectClientAtlas()
// 		.then(r =>{
// 			// console.log(r)
// 			 res.send({ result: r});
// 			//res.send({ result: "connected"});
// 		},e =>{console.error(e)
// 			res.status(500).send(e)
// 		});
//  });

app.post('/api/testAtlas', (req, res) => {

	db_mongo_api.testAtlas()
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

app.post('/api/testAtlas2', (req, res) => {

	db_mongo_api.testAtlas2()
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

app.post('/api/testAtlasAsync', (req, res) => {

	db_mongo_api.testAtlasAsync()
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

app.post('/api/testAtlasProm', (req, res) => {

	db_mongo_api.testAtlasProm()
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

app.post('/api/testAtlas3', (req, res) => {

	db_mongo_api.testAtlas3()
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});

//========================================================


app.post('/api/artistSongkickMatch', (req, res) => {

	var songkickArtist = {id:2290286}
	db_api.checkDBFor_artist_artistSongkick_match(songkickArtist)
		.then(r =>{
			//console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});


//testing: on time connection

// db.clientAtlas()
// 	.then(r =>{
// 		console.log(r)
// 		res.send({ result: r});
// 	},e =>{console.error(e)
// 		res.status(500).send(e)
// 	});


//todo:not understanding where the failures here went?
//like this *works* now but I swear before it wasn't when I had it in db_api


const sql = require('mssql')
var config_rds = {
	"user": 'admin',
	"password": 'CAiMmZSYWluuJ5VDeQNS',
	"server": 'soundfound-db.crqf6gmeo1va.us-east-1.rds.amazonaws.com',
	// "database": 'soundfound-db',
	"database": 'soundfound',
	"port": 1433,
	"dialect": "mssql",
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

module.exports.poolGlobal = {};
// const poolPromise = new sql.ConnectionPool(config_rds)
// 	.connect()
// 	.then(pool => {
// 		console.log('Connected to MSSQL | poolPromise')
// 		module.exports.poolGlobal = pool;
// 		return pool
// 	})
// 	.catch(err => console.log('Database Connection Failed |  poolPromise', err))

//testing: assume it's stored between events in lambda?
//https://www.jeremydaly.com/reuse-database-connections-aws-lambda/

// If 'client' variable doesn't exist
// if (typeof poolPromise === 'undefined') {
// 	// Connect to the MySQL database
//
// 	var poolPromise = new sql.ConnectionPool(config_rds)
// 		.connect()
// 		.then(pool => {
// 			console.log('Connected to MSSQL')
// 			//client = pool;
// 			return pool
// 		})
// 		.catch(err => console.log('Database Connection Failed! Bad Config: ', err))
// }


app.post('/api/testRDS', (req, res) => {
	console.log("testRDS...");

	db_api.testRDS()
		.then(r =>{
			console.log(r)
			res.send({ result: r});
		},e =>{console.error(e)
			res.status(500).send(e)
		});
});


//testing: setup RDS proxy?
//https://stackoverflow.com/questions/59896155/reuse-database-connection-across-multiple-aws-lambda-invocations
//https://aws.amazon.com/blogs/compute/using-amazon-rds-proxy-with-aws-lambda/



//testing: just trying to do no-pool testing of rds connection
app.post('/api/testRDS2', (req, res) => {
	console.log("testRDS2...");

	// Connect to the MySQL database

	var getPool =  function(){
		return new sql.ConnectionPool(config_rds).connect().then(pool => {
			console.log('Connected to MSSQL | getPool'); return pool})
			.catch(err => console.log('Database Connection Failed |  getPool', err))
	}

	getPool()
		.then(pool =>{
			var sreq = new sql.Request(pool);
			sreq.query("select getdate();")
				.then(function(r){
					console.log("testRDS2 finished");
					pool.close()
					res.send({result:r})
				})
		})
		.catch(err => console.log('Database Connection Failed! Bad Config: ', err))
});


//testing: don't know how to access context with how I have handler set below...
// const handlerFunction = (event, context, callback) => {
// 	console.log("handlerFunction");
// 	callback(null, {result:"handlerFunction"})
// }
//
// module.exports.handler2 = handlerFunction;


//================================
//serverless

//https://docs.amplify.aws/guides/api-rest/express-server/q/platform/ios/#deploying-the-service

///module.exports.handler = serverless(app);
const server = awsServerlessExpress.createServer(app);

//todo: no idea what this was about
//appears to be related to serverless / lambda deploy, maybe where this client is only actually used
//when AWS calls this handler

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://admin2:fuckingstupidbullshit@cluster0.th2x5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let client = new MongoClient(uri,
	{ useNewUrlParser: true, useUnifiedTopology: true });
const clientPromise = client.connect();

//todo: checking if this persists over invocations (it doesn't)

let outsideHandlerVar = 0;
module.exports.handler = async function(event, context){
	//console.log("HANDLER",outsideHandlerVar);
	client = await clientPromise;
	// Use the client to return the name of the connected database.
	//return client.db().databaseName;

	outsideHandlerVar = 1
	context.callbackWaitsForEmptyEventLoop = false;
	//console.log(`EVENT: ${JSON.stringify(event)}`);
	return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};

module.exports.mongoClient = client
module.exports.getMongoClient = function(){return client}
app.post('/api/testNewMongo', (req, res) => {
db_mongo_api.testAtlasAsync2()
	.then(r =>{
		res.send({ result: r});
	},e =>{
		res.status(500).send(e)
	})
});

///https://stackoverflow.com/questions/65724538/what-is-causing-mongodb-timeout-error-on-aws-lambda/67530789#67530789
//todo: not going to run locally w/out invoking handler obvs
module.exports.handlerFunction = async (event, context) => {

	console.log("handlerFunction...");
	try {
		/**
		 * Lambda’s context object exposes a callbackWaitsForEmptyEventLoop property,
		 * that effectively allows a Lambda function to return its result to the caller
		 * without requiring that the MongoDB database connection be closed.
		 * This allows the Lambda function to reuse a MongoDB connection across calls.
		 */
		context.callbackWaitsForEmptyEventLoop = false

		var getPool =  function(){
			return new sql.ConnectionPool(config_rds).connect().then(pool => {
				console.log('Connected to MSSQL | getPool'); return pool})
				.catch(err => console.log('Database Connection Failed |  getPool', err))
		}

		let pool = await getPool()
		var sreq = new sql.Request(pool);
		sreq.query("select getdate();")
			.then(function(r){
				console.log("testRDS2 finished");
				pool.close()
				//res.send({result:r})
			})

		//.catch(err => console.log('Database Connection Failed! Bad Config: ', err))

	} catch (error) {
		console.error('Lambda handler root error.')
		throw error
	}
}



