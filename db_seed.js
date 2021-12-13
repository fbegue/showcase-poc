var db_mongo_api = require("./apis/db_mongo_api")
var  db_api = require('./apis/db_api.js');

//note: scripted insert of genre_family info
async function insertStatic(){
	try{
		await db_api.insert_families();
		await db_api.insertStaticGenres();
		//creates the binds for the static
		await db_api.createFamilyBinds();
		return "insertStatic complete!"
	}catch (error) {
		console.error(error);
		return error;
	}
}

// setTimeout(t =>{
// 	console.log("insertStatic...");
// 	insertStatic()
// 		.then(r =>{console.log("insertStatic finished!");},e =>{console.error(e)});
// },2000);


//note: inserting example spotifyUsers
module.exports.insertSpotifyUsers = db_mongo_api.insertSpotifyUsers;
module.exports.insertStatic = insertStatic;
