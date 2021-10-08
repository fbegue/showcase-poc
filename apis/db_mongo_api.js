var clientAtlas = require('../db').clientAtlas
var getClientAtlas = require('../db').getClientAtlas
var clientAtlasProm = require('../db').clientAtlasProm
var db = require('../db')
var genreFam_map = require('./db_api').genreFam_map

//----------------------------------

const { MongoClient } = require('mongodb');

var me = module.exports;

//todo: I just CAN NOT fucking pass an instance of this shit. wtf
async function localAtlas() {
	try {
		console.log("localAtlas...");
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

		let c = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
		return c
		// let clientAtlas = await c.connect()
		// var dbo = clientAtlas.db("soundfound");
		// let tr = await dbo.collection('users').find({}).toArray()
		// console.log("localAtlas",tr.length);
		//return clientAtlas
	} catch(e) {
		console.log("localAtlas",e);
	}

}

//testing:
let clientAtlasInst= null;
// clientAtlasProm
// 	.then(clientAtlas =>{
// 		clientAtlasInst = clientAtlas
// 		var dbo = clientAtlas.db("soundfound");
// 		dbo.collection('users').find({}).toArray().then(r2 =>{
// 			console.log("clientAtlasProm",r2.length);
// 		})
// 	})

// var setup =  function(){
//     return new Promise(function(done, fail) {
// 		clientAtlas()
// 			.then(c =>{done()},err =>{fail(err)})
//     })
// }

me.testAtlas =  function(){
	return new Promise(function(done, fail) {
		//var dbo = client.db("soundfound");
		//var client = getClientAtlas()
		//console.log("testAtlas",client);
		var dbo = clientAtlasInst.db("soundfound");
		dbo.collection('users').find({}).toArray().then(r2 =>{
			done(r2)
		})
	})
}

me.testAtlas2 =  function(){
	return new Promise(function(done, fail) {
		//var dbo = client.db("soundfound");
		var clientAtlas = getClientAtlas()
		//console.log("testAtlas",client);
		var dbo = clientAtlas.db("soundfound");
		dbo.collection('users').find({}).toArray().then(r2 =>{
			done(r2)
		})
	})
}

me.testAtlas3 =  function(){
	return new Promise(function(done, fail) {
		db.getConnectClientAtlas()
			.then(clientAtlas =>{
				var dbo = clientAtlas.db("soundfound");
				dbo.collection('users').find({}).toArray().then(r2 =>{
					done(r2)
				})
			})
	})
}

//testing: wait on promise instead?
// async function testAtlasAsync() {
//
// 	try {
// 		console.log("testAtlasAsync...");
// 		const ob = await localAtlas()
// 		const  clientAtlas = await ob.connect()
// 		var dbo = clientAtlas.db("soundfound");
// 		return dbo.collection('users').find({}).toArray()
// 	} catch(e) {
// 		console.log("testAtlasAsync",e);
// 	}
// }



//===========================================================
const uriRemote = "mongodb+srv://cluster0.th2x5.mongodb.net/soundfound?authSource=$external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority"
const uriLocal = "mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/"
let uri = null;
if(process.env.AWS_SESSION_TOKEN === undefined){
	//console.log("connecting to local mongo atlas instance");
	uri = uriLocal
}
else{
	//console.log("connecting to remote mongo atlas instance");
	uri = uriRemote
}

clientAtlas = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//===========================================================

//snippet

// clientAtlas.connect()
// 	.then(ignored => {
//
// 	},e =>{console.error(e);fail(e)})

me.testAtlasProm =  function(){
	return new Promise(function(done, fail) {
		clientAtlas.connect()
			.then(ignored =>
				{
					var dbo = clientAtlas.db("soundfound");
					dbo.collection('9480').find({}).toArray()
						.then(r2 =>{
							console.log("events",r2.length);
							done(r2)
						}).catch(e =>{
						console.log("MongoClient connect test failure",e);
						fail(e);
					})
				}
				,e =>{console.error(e);fail(e)})
	})
}

//testing: this is fucking equivalant to testAtlasProm (literally just connectClientAtlas) but doesn't FUCKING WORK
async function testAtlasAsync() {

	try {

		let clientAtlasInst = await clientAtlas.connect()
		var dbo = clientAtlasInst.db("soundfound");
		let users  = await dbo.collection('users').find({}).toArray()
		return users[0]
	} catch(e) {
		console.log("testAtlasAsync",e);
	}
}

me.testAtlasAsync = testAtlasAsync;
// var seedMongoGenre =  function(){
// 	return new Promise(function(done, fail) {
//
// 		clientAtlas.connect()
// 			.then(ignored => {
// 				var dbo = clientAtlas.db("soundfound");
// 				Object.keys(genreFam_map).forEach(g => {
//
// 				})
// 				dbo.collection('genres').insertMany(payload).then(r2 =>{
// 					done(r2)
// 				})
// 			},e =>{console.error(e);fail(e)})
// 	})
// }
//===================================================================
//soundfound api

//always empties the DB before inserting
me.insert =  function(events){
	return new Promise(function(done, fail) {


clientAtlas.connect()
	.then(ignored => {
		var dbo = clientAtlas.db("soundfound");
		//infer correct collection from one sample event
		// dbo.collection(events[0].venue.metroArea.id).insert(events).then(r =>{
		// 	done(r)
		// })
		console.log("committing to mongo collection:",events[0].venue.metroArea.id);
		var c = events[0].venue.metroArea.id.toString()
		dbo.collection(c).deleteMany({}).then(r =>{
			dbo.collection(c).insertMany(events).then(r2 =>{
				done(r2)
			})
		})
		//todo: can't figure out the easy way to do a massive insert if not already in collection wtf?
		//it can't really be a find and insert if not found right?

		// https://docs.mongodb.com/stitch/mongodb/actions/collection.insertMany/
		// https://docs.mongodb.com/stitch/mongodb/actions/collection.updateMany/

		//.updateMany({},events,{"upsert":true}).then(r =>{
	},e =>{console.error(e);fail(e)})



	})
}

me.insertStaticUsers =  function(payload){
	return new Promise(function(done, fail) {
		var dbo = client.db("soundfound");
		payload[0].updatedAt = new Date().toISOString()
		dbo.collection('users').insertMany(payload).then(r2 =>{
			done(r2)
		})
	})
}



me.saveSnapshotPlaylists =  function(user,snapMap){
	return new Promise(function(done, fail) {
		var dbo = client.db("soundfound");
		dbo.collection('users').updateOne({id:user.id},{$set : {snapMap:snapMap}})
			.then(r2 =>{
				done(r2)
			})
	})
}

me.fetchStaticUser =  function(user){
	return new Promise(function(done, fail) {

		clientAtlas.connect()
			.then(ignored => {
				//console.log("user.id",user.id);
				var dbo = clientAtlas.db("soundfound");
				dbo.collection('users').find({id:user.id}).toArray()
					.then(arr =>{
						//testing:
						arr[0] ? done(arr[0]) : done(null)
						// r[0] ? done(r[0]) : fail('couldnt find user' + user.id)
					})
			},e =>{console.error(e);fail(e)})


	})
}

me.fetch =  function(param){
	return new Promise(function(done, fail) {


		clientAtlas.connect()
			.then(ignored => {

				var events = [];
				console.log("fetching...");
				var dbo = clientAtlas.db("soundfound");

				if(param === 'all'){
					var states = {"OH":[
							{"displayName":"Columbus", "id":9480},
							{"displayName":"Cleveland", "id":14700},
							{"displayName":"Cincinnati", "id":22040},
							// {"displayName":"Dayton", "id":3673},
							{"displayName":"Toledo", "id":5649}
						]};
					var proms = [];
					states['OH'].forEach(m =>{
						//console.log("m",m.id);
						proms.push(dbo.collection(m.id.toString()).find().toArray())
					})
					Promise.all(proms)
						.then(r =>{
							r.forEach(ra =>{
								events = events.concat(ra);
							})
							console.log(events.length);
							done(events)
						})
				}else{
					events = events.concat(dbo.collection(param).find().toArray())
					done(events)
				}
			},e =>{console.error(e);fail(e)})

	})
}

me.fetchSpotifyUsers =  function(){
	return new Promise(function(done, fail) {
		//console.log("user.id",user.id);
		//testing:
		clientAtlas.connect()
			.then(ignored =>{
				var dbo = clientAtlas.db("soundfound");
				done(dbo.collection('spotifyUsers').find({}).toArray());
			})

	})
}

me.fetchUser =  function(id){
	return new Promise(function(done, fail) {
		console.log("user id",id);
		clientAtlas.connect()
			.then(ignored =>
				{
					var dbo = clientAtlas.db("soundfound");
					dbo.collection('users').find({id:id}).toArray()
						.then(users =>{

							//console.log("events",r2.length);
							done(users[0])
						}).catch(e =>{
						console.log("MongoClient connect test failure",e);
						fail(e);
					})
				}
				,e =>{console.error(e);fail(e)})
	})
}

//seeding

me.insertSpotifyUsers =  function(payload){
	return new Promise(function(done, fail) {

		clientAtlas.connect()
			.then(ignored => {
				var spotifyUsers = require('../example data objects/spotifyUsers').spotifyUsers
				var dbo = clientAtlas.db("soundfound");
				dbo.collection('spotifyUsers').insertMany(spotifyUsers).then(r2 =>{
					done(r2)
				})
			},e =>{console.error(e);fail(e)})

	})
}



// module.exports = {insert,fetch,insertStaticUsers,saveSnapshotPlaylists,fetchSpotifyUsers,
// 	fetchUser,testAtlas,testAtlas2,testAtlasAsync,testAtlas3,testAtlasProm}

//
// import_client().then(client =>{
// 	var dbo = client.db("soundfound");
// 	dbo.collection("events").insert({test:1});
// 	var events = dbo.collection("events").find({}).toArray();
//
// 	events.then(e =>{console.log(e)})
// })

// events.each(e =>{
// 	console.log(e);
// });

// MongoClient.connect(url, function(err, c) {
//
// 	// const dbName = 'test';
//
// 	//const adminDb = client.db(dbName).admin();
// 	// adminDb.listDatabases(function(err, dbs) {
// 	// 	console.log("$dbs",dbs);
// 	// 	client.close();
// 	//
// 	// });
//
// 	var dbo = client.db("soundfound");
// 	dbo.collection("events").insert({test:1});
// 	var events = dbo.collection("events").find({}).toArray();
// 	events.then(e =>{console.log(e)})
// 	// events.each(e =>{
// 	// 	console.log(e);
// 	// });
//
// });
