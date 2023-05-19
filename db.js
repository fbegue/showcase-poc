const sql = require('mssql')
var os = require("os");

//todo: pulling db_api in at any point = `db.getPoolRDS is not a function` anywhere it'
//const db_api = require('./apis/db_api')
//const config = {/*...*/}

var IM = require('./utility/inMemory')

var config_local = {
	"user": 'test',
	"password": 'test',
	"server": 'DESKTOP-TMB4Q31\\SQLEXPRESS',
	"database": 'master',
	"port": '61427',
	"dialect": "mssql",
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

var config_rds = {
	"user": 'admin',
	"password": 'Cy4NuJPvLGF8',
	"server": 'soundfound-db.crqf6gmeo1va.us-east-1.rds.amazonaws.com',
	// "database": 'soundfound',
	"database": 'SampleDatabase',
	"port": 1433,
	"dialect": "mssql",
	// "requestTimeout":16000,
	"requestTimeout":32000,
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

var config_remote = {
	"user": 'test',
	"password": 'test',
	"server": '192.168.68.103:1433',
	"database": 'master',
	"port": '61427',
	"dialect": "mssql",
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

var config = null
if(os.hostname() === "DESKTOP-TMB4Q31"){
	config=config_local
	console.log("connecting to sql server:" + config_local.server);
}else{
	config=config_rds
	console.log("connecting to sql server" + config_rds.server);
}


//console.log("FORCE config_rds:" + config_rds.server);
//config=config_rds

// var client =  function(){
// 	return new Promise(function(done, fail) {
// 		const MongoClient = require('mongodb').MongoClient;
// 		const url = 'mongodb://localhost:27017/master';
// 		MongoClient.connect(url, function(err, c) {
// 			console.log('Connected to mongo')
// 			done(c)
// 		})
// 	})
// }

// var client = {};

const { MongoClient } = require('mongodb');
// Export a module-scoped MongoClient promise. By doing this in a separate
// module, the client can be shared across functions.

// const url = 'mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/soundfound?retryWrites=true&w=majority';
// const client = new MongoClient(url,
// 	{ useNewUrlParser: true,  useUnifiedTopology: true });

// console.log("connecting to mongo...");
// client.connect()
// .then(r =>{"client.connect() complete"},e =>{
// 	console.error("mongo client.connect() error")
// 	console.error(e)
// })
// module.exports = client.connect();

//testing: no params, and callback
// var clientAtlas =  function(){
// 	return new Promise(function(done, fail) {
//
// 		const MongoClient = require('mongodb').MongoClient;
// 		// const url = 'mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
// 		const url = 'mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/soundfound?retryWrites=true&w=majority';
// 		console.log("connecting to mongo...");
// 		MongoClient.connect(url, function(err, c) {
// 			if(err){
// 				console.error(err);
// 				fail(err)
// 			}
// 			else{
// 				console.log('Connected to mongo atlas')
// 				//client = c;
// 				done(c)
// 			}
//
// 		})
// 	})
// }

let clientAtlas = {};

//testing: only here for test purposes
//todo: recall connections are all made at top of apis/db_mongo_api.js
//b/c couldn't figure out how to get this shit to work properly
var connectClientAtlas =  function(){
	return new Promise(function(done, fail) {

		// console.log("AWS_ACCESS_KEY_ID",process.env.AWS_ACCESS_KEY_ID);
		// console.log("AWS_ACCESS_KEY_ID",process.env.AWS_SECRET_ACCESS_KEY);
		// console.log("AWS_SESSION_TOKEN",process.env.AWS_SESSION_TOKEN);

		// process.env.AWS_ACCESS_KEY_ID ="ASIAUUHLPBEBDQIDLEAP";
		// process.env.AWS_SECRET_ACCESS_KEY = "n4WphwQHYXF1Qr8LGAZGkRl6L5/sDb4ZvnnI1j6S"
		// process.env.AWS_SESSION_TOKEN = "IQoJb3JpZ2luX2VjEDEaCXVzLWVhc3QtMSJIMEYCIQC+d7Y7IyQHO0miGNNwgj88m2+LG/f/pereRXRa8aJHyAIhAKLvUkhOjPn1/KPVgfy2YCAS0gOR+9QW/qWO2WH/R5yhKqECCHoQAhoMMzE4MzIxMzk1OTcwIgxl3iGIJmTE1bHHSF0q/gF6tnEdnMExxv5xmomuyIg4PObU+/OoExFXuMjWc3Ics/1m3KFUvlh69EP2H/yrWbzqt801PLwKj+2bt6AkTmPS/B3+6503wIsQgoxaPblOZizcxVRs2a8IHOCb+BRzRmJN50fOZnf16FCygizVCxVVXVvvoEi/NDFTC8v3xXwV8JyL6jhC5hUtT5RO1akFL04VZPQ0TTqhUh62l/9a2SqzJM/lIQWpz9Md1pSqjEtroyvgSZGk2KuU/d3cG14lnxmgoSy9FWBmtJhZ5O0e9Wc18OlqWe5k+nasaZtfnh/AzQnU7CJGO7WHchHoxjjaSAXEoyHn1mSyxd8jV7P4XTDSgdmJBjqZAfVBkf631LVGYy4NF9BAVC+85bNgXX8+nS2wjzdCczMmucLdEOcJw+UlYQ7f71kr/126SOCCt0k3CL07dToIC298ZnhyffVL4082QprrCBH8eoisyEdTSe5vRtkGqgczhIfils/E3yvy3b0xQfZ4MP7Vm00n/4Bh5FaMLgBk/vAfFyOYqD4iPgxTWjiDg88ph8+a3A5nK4vI3Q=="

		// authMechanism = "MONGODB-AWS";
		//https://docs.mongodb.com/drivers/node/fundamentals/authentication/mechanisms/

		//makes sense to configure using lambda env's
		//https://www.mongodb.com/community/forums/t/how-to-connect-from-aws-lambda-function-to-mongo-atlas-by-using-an-iam-role-which-is-password-less/100319/5
		//uri = "mongodb+srv://<AWS access key>:<AWS secret key>@cluster0.th2x5.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority&authMechanismProperties=AWS_SESSION_TOKEN:<session token (for AWS IAM Roles)>";
		//const uri = `mongodb+srv://${encodeURIComponent(process.env.AWS_ACCESS_KEY_ID)}:${encodeURIComponent(process.env.AWS_SECRET_ACCESS_KEY)}@cluster0.th2x5.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority&authMechanismProperties=AWS_SESSION_TOKEN:${encodeURIComponent(process.env.AWS_SESSION_TOKEN)}`

		//todo: at some point I became confused and thought that I had a local cluster and a remote one?
		//but both of these configs are just mechanisms to hit the remote one
		//the env's are magic?
		//https://stackoverflow.com/questions/67198660/why-cant-my-aws-lambda-node-js-app-access-my-mongodb-atlas-cluster
		const uriRemote = "mongodb+srv://cluster0.th2x5.mongodb.net/soundfound?authSource=$external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority"
		const uriLocal = "mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/"

		let uri = null;

		if(process.env.AWS_SESSION_TOKEN === undefined){
			console.log("connecting to local mongo atlas instance");
			uri = uriLocal
		}
		else{
			console.log("connecting to remote mongo atlas instance");
			uri = uriRemote
		}
		//console.log("clientAtlas2",uri);


		//https://docs.atlas.mongodb.com/best-practices-connecting-from-aws-lambda/

		// async function asyncCall() {
		// 	console.log("connect");
		// 	var t1 = clientAtlas.connect()
		// 	console.log("dbo");
		// 	var dbo = clientAtlas.db("soundfound");
		// 	console.log("soundfound");
		// 	var r = dbo.collection('9480').find({}).toArray()
		// 	console.log("events",r.length);
		// 	return r
		// 	// expected output: "resolved"
		// }

		clientAtlas = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
		clientAtlas.connect()
			.then(r =>
				{
					// console.log("clientAtlas connected",clientAtlas);
					console.log("clientAtlas connected");

					var dbo = clientAtlas.db("soundfound");
					// dbo.collection('users').find({}).toArray()
					dbo.collection('9480').find({}).toArray()
						.then(r2 =>{
						// console.log("users",r2);
							console.log("events",r2.length);
						done(r2)
					}).catch(e =>{
						console.log("MongoClient connect test failure",e);
						fail(e);
					})
				}
				,e =>{console.error(e);fail(e)})
		//var client = getClientAtlas()
	})
}

//testing: invoke automatically
// connectClientAtlas()
// 	.then(pool => {
// 		console.log('Connected to mongo atlas')
// 		return clientAtlas;
// 	})
// 	.catch(err => console.log('Mongo-Atlas Connection Failed! Bad Config: ', err))

//testing: set it above and allow other modules to call active instance
var getClientAtlas =  function() {
return clientAtlas;
}

//testing: best practice
//https://docs.atlas.mongodb.com/best-practices-connecting-from-aws-lambda/
let clientAtlasProm = null;

// const uriRemote = "mongodb+srv://cluster0.th2x5.mongodb.net/soundfound?authSource=$external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority"
// const uriLocal = "mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/"
// let uri = null;
// if(process.env.AWS_SESSION_TOKEN === undefined){
// 	console.log("connecting to local mongo atlas instance");
// 	uri = uriLocal
// }
// else{
// 	console.log("connecting to remote mongo atlas instance");
// 	uri = uriRemote
// }
// clientAtlas = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// let clientAtlasProm = clientAtlas.connect()
// 	.catch(e =>{
// 		console.log("mongo atlas instance connnect error",e);
// 	})



//todo: prevent autorun
//serverless express aws lambda mssql share connection

//testing: was causing postInfo failure?
//const poolPromise = {};


// var getGenres =  function(poolRDS){
// 	return new Promise(function(done, fail) {
// 		//var poolRDS = db.getPoolRDS()
// 		var sreq = new sql.Request(poolRDS);
//
// 		let gQry = "select g.id,g.name as name,f.id as family_id, f.name as family_name" +
// 			" from genre_family gf join genres g on gf.genre_id=g.id join families f on f.id = gf.family_id"
// 		sreq.query(gQry).then(function (res) {
// 			done(res.recordset);
// 		}).catch(function (err) {
// 			//console.log(err);
// 			fail(err);
// 		})
// 	})
// }
//
// var setGenresQualifiedMap =  function(pool){
// 	return new Promise(function(done, fail) {
// 		getGenres(pool)
// 			.then(genres => {
// 				module.exports.genresQualifiedMap = {};
// 				genres.forEach(g => {
// 					module.exports.genresQualifiedMap[g.name] = g
// 				})
// 				db_api.setFG(pool).then(r =>{
// 					console.log("setInMemory finished");
// 					done("setGenresQualifiedMap")
// 				},e =>{fail(e)})
//
// 			},e =>{fail(e)})
// 	})
// }


var poolRDS = {}
const poolPromise = new sql.ConnectionPool(config)
	.connect()
	.then(pool => {
		console.log('Connected to MSSQL')
		IM.setGenresQualifiedMap(pool).then(msg =>{
			console.log(msg);
			return pool
		})
		poolRDS = pool;
		return pool
	})
	.catch(err => console.log('SQL Database Connection Failed! Bad Config: ', err))

var getPoolRDS = function(){
	return poolRDS
}

module.exports = {
	sql, poolPromise,poolRDS,getPoolRDS,connectClientAtlas
	//clientAtlas,getClientAtlas,clientAtlasProm,getConnectClientAtlas
}
//module.exports.connect = client.connect()
	//.then(r =>{"client.connect() complete"},e =>{console.error("mongo client.connect() error",e);})
