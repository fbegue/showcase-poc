var db_mongo_api = require('../apis/db_mongo_api')
var spotify_api = require('../apis/spotify_api')
var me = module.exports;

//note: unless you're using an actual login, topTracks and topArtists will default to my stuff
//using the fallback faker will work fine for everything else for test purposes

//add new users
var frankyUser = {
	"display_name":"Franky Begue",
	"id":"dacandyman01",
	"friend":false,
	"isUser":true
}

var joshUser = {
	display_name:"tipshishat",
	id:"tipshishat"
}

var citizenUser = {
	display_name:"Complacent Citizen",
	id:"31arvc2xba2nerbxzr7mkyrl4gvm"
}

var danUser2 = {
	"display_name" : "Daniel Niemiec#2",
	"id" : "123028477#2",
}

//add friends to user


me.modifyFriends  = function(req,res){
	//var ids = [citizenUser.id]


	// db_mongo_api.addFriend(frankyUser,{...citizenUser,friend:true})
	//db_mongo_api.addFriend(frankyUser,true)
	//db_mongo_api.modifyFriends(joshUser,false)
	db_mongo_api.modifyFriends(req.body.auth.user,{...req.body.friend,friend:true})
		.then(r =>{
			res.send(r)
		},e =>{

			res.status(500).send(e)
		})

}

me.findFriend  = function(req,res){
	//var ids = [citizenUser.id]

	// db_mongo_api.addFriend(frankyUser,{...citizenUser,friend:true})
	//db_mongo_api.addFriend(frankyUser,true)
	db_mongo_api.fetchUser("tipshishat")
		.then(r =>{
			res.send(r)
		},e =>{

			res.status(500).send(e)
		})

}

//note: can't do this w/out using that user's refresh token
me.rebuildUser  = async function(req,res){

	try{
		await db_mongo_api.removeUser(citizenUser)
		await spotify_api.storeStaticUser(req,res)

	} catch(e){
		res.status(500).send(e)
		console.error(e);debugger}
}






