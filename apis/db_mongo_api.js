//var clientAtlas = require('../db').clientAtlas
//var getClientAtlas = require('../db').getClientAtlas
//var clientAtlasProm = require('../db').clientAtlasProm
var db = require('../db')
var genreFam_map = require('./db_api').genreFam_map
var app = require('../app')
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

// me.testAtlas2 =  function(){
// 	return new Promise(function(done, fail) {
// 		//var dbo = client.db("soundfound");
// 		var clientAtlas = getClientAtlas()
// 		//console.log("testAtlas",client);
// 		var dbo = clientAtlas.db("soundfound");
// 		dbo.collection('users').find({}).toArray().then(r2 =>{
// 			done(r2)
// 		})
// 	})
// }

// me.testAtlas3 =  function(){
// 	return new Promise(function(done, fail) {
// 		db.getConnectClientAtlas()
// 			.then(clientAtlas =>{
// 				var dbo = clientAtlas.db("soundfound");
// 				dbo.collection('users').find({}).toArray().then(r2 =>{
// 					done(r2)
// 				})
// 			})
// 	})
// }

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
const uriLocalCluster = "mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/"

//note: deprecated Robo3T db
const uriLocalDB = "mongodb://localhost:27017"

let uri = null;
if(process.env.AWS_SESSION_TOKEN === undefined){
	console.log("connecting to local mongo atlas instance");
	uri = uriLocalCluster
	//testing:
	//uri = uriLocalDB;
}
else{
	console.log("connecting to remote mongo atlas instance");
	uri = uriRemote
}


let clientAtlas = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//===========================================================

//note: snippet that surrounds all of these calls b/c I can't figure out wtf is wrong here
var SFDB;
clientAtlas.connect(function(err, database) {
	if(err) throw err;
	SFDB = database.db('soundfound');
})

me.testAtlasProm =  function(){
	return new Promise(function(done, fail) {
		SFDB.collection('9480').find({}).toArray()
			.then(r2 =>{
				console.log("events",r2.length);
				done(r2)
			}).catch(e =>{
			console.log("MongoClient connect test failure",e);
			fail(e);
		})
	})
}

me.testAtlasProm_old =  function(){
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

me.testAtlasAsync2 = async function() {

	try {
		var client = app.getMongoClient()
		console.log(client.db().databaseName);
		var dbo = client.db("soundfound");
		return dbo.collection('users').find({}).toArray()
			.then(r =>{
				console.log("testAtlasAsync:",r.length);
				return r
			},e =>{
				console.error("testAtlasAsync failure:",e);
				throw(e)
			})

	} catch(e) {
		//console.log("testAtlasAsync2",e);
		throw(e)
	}
}

//===================================================================
//soundfound api


//always empties the DB before inserting
me.insert =  function(events){
	return new Promise(function(done, fail) {


		//infer correct collection from one sample event
		// dbo.collection(events[0].venue.metroArea.id).insert(events).then(r =>{
		// 	done(r)
		// })
		console.log("committing to mongo collection:",events[0].venue.metroArea.id);
		var c = events[0].venue.metroArea.id.toString()
		SFDB.collection(c).deleteMany({}).then(r =>{
			SFDB.collection(c).insertMany(events).then(r2 =>{
				done(r2)
			})
		})
		//todo: can't figure out the easy way to do a massive insert if not already in collection wtf?
		//it can't really be a find and insert if not found right?

		// https://docs.mongodb.com/stitch/mongodb/actions/collection.insertMany/
		// https://docs.mongodb.com/stitch/mongodb/actions/collection.updateMany/
	})
}

me.insertStaticUsers =  function(payload){
	return new Promise(function(done, fail) {
		payload[0].updatedAt = new Date().toISOString()
		SFDB.collection('users').insertMany(payload).then(r2 =>{
			done(r2)
		})
	})
}

me.refreshStaticUser =  function(user,fake){
	return new Promise(function(done, fail) {

		//console.log("user.id",user.id);
		SFDB.collection('users').updateOne({id:fake || user.id},
			//todo: just images for now
			{ $set: {images:user.images}
			})
			.then(r =>{
				r.modifiedCount === 1 ? done(r) : fail("refreshStaticUser couldn't update" + user.id)
			})

	})
}


//todo: snippet
me.saveSnapshotPlaylists =  function(user,snapMap){
	return new Promise(function(done, fail) {
		SFDB.collection('users').updateOne({id:user.id},{$set : {snapMap:snapMap}})
			.then(r2 =>{
				done(r2)
			})
	})
}

me.fetchStaticUser =  function(user){
	return new Promise(function(done, fail) {
		SFDB.collection('users').find({id:user.id}).toArray()
			.then(arr =>{
				arr[0] ? done(arr[0]) : done(null)
				// r[0] ? done(r[0]) : fail('couldnt find user' + user.id)
			})
	})
}

me.fetch =  function(param){
	return new Promise(function(done, fail) {

		var events = [];
		console.log("fetching...");

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
				proms.push(SFDB.collection(m.id.toString()).find().toArray())
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
			events = events.concat(SFDB.collection(param).find().toArray())
			done(events)
		}


	})
}

me.fetchSpotifyUsers =  function(){
	return new Promise(function(done, fail) {
		//console.log("user.id",user.id);
		//testing:
		done(SFDB.collection('spotifyUsers').find({}).toArray());
	})
}

me.fetchUser =  function(id){
	return new Promise(function(done, fail) {
		console.log("user id",id);
		{
			SFDB.collection('users').find({id:id}).toArray()
				.then(users =>{

					//console.log("events",r2.length);
					done(users[0])
				}).catch(e =>{
				console.log("MongoClient connect test failure",e);
				fail(e);
			})
		}

	})
}

//seeding

me.insertSpotifyUsers =  function(payload){
	return new Promise(function(done, fail) {
		var spotifyUsers = require('../example data objects/spotifyUsers').spotifyUsers
		SFDB.collection('spotifyUsers').insertMany(spotifyUsers).then(r2 =>{
			done(r2)
		})
	})
}

/** @func addFriend
 * @param user
 * @param payload:{}   => a single user to be added as a friend to related_users
 * - TRUE => set all related_users to friend:true
 * - FALSE => "" to friend:false
 * @param flag if set, changes behavior of payload as above
 * */
me.addFriend =  async function(user,payload,flag){
	var cUsers;

	 if(flag){
		var user = await me.fetchUser(user.id)
		cUsers = user.related_users.map(r =>{return {...r,friend:payload}})
	}
	else{
		var user = await me.fetchUser(user.id)
		var cfriends = user.related_users.filter(r => r.friend)
		 //console.log({cfriends});
		cUsers = [...user.related_users,payload];
	}

	var r = await SFDB.collection('users').updateOne({id:user.id},
		{ $set: {
				related_users:cUsers
			}})
	if(r.modifiedCount === 1){return r}
	else{
		throw("refreshStaticUser couldn't update" + user.id);
	}

}

me.removeUser =  async function(user){
	var r = await SFDB.collection('users').deleteOne({id:user.id})

	if(r.deletedCount === 1){return r}
	else{
		throw("refreshStaticUser couldn't update" + user.id);
	}

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
