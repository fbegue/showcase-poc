
var  db_api = require('./apis/db_api.js');

//scripted insert of genre_family info
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

//testing:
//example spotifyUsers
// db_mongo_api.insertSpotifyUsers()



// setTimeout(t =>{
// 	console.log("insertStatic...");
// 	insertStatic()
// 		.then(r =>{console.log("insertStatic finished!");},e =>{console.error(e)});
// },2000);


module.exports.insertStatic = insertStatic;
