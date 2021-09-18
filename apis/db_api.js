// const sApi = require('./spotify_api');
//testing:
const sApi = {poolGlobal:{}}
const util = require('../util')
var rp = require('request-promise');
let sql = require("mssql");
var _ = require('lodash');
var app =  require('../app')
var db = require('../db')


//--------------------------------------------------------
var all_genres = require('../example data objects/all_genres').all_genres
var familyGenre_map = {};
var genreFam_map= {};
var families =  [
	{id:1,name:"pop"},
	{id:2,name:"electro house"},
	{id:3,name:"rock"},
	{id:4,name:"hip hop"},
	{id:5,name:"r&b"},
	{id:6,name:"latin"},
	{id:7,name:"country"},
	{id:8,name:"metal"},
	{id:9,name:"punk"},
	{id:10,name:"blues"},
	{id:11,name:"reggae"},
	{id:12,name:"world"},
	{id:13,name:"jazz"},
	{id:14,name:"classical"},
	{id:15,name:"folk"}
]

all_genres.forEach(function(t){
	t.family.forEach(function(f){
		if(!(familyGenre_map[f])){
			familyGenre_map[f] = [];
		}
		familyGenre_map[f].push(t.name)
	});
	genreFam_map[t.name] = t.family

});
// console.log("$familyGenre_map",familyGenre_map);
// console.log("$genreFam_map",genreFam_map);

//--------------------------------------------------------
var me = module.exports;

me.genreFam_map = genreFam_map;
me.familyGenre_map = familyGenre_map;

// module.exports.checkDb = function(){
//
// };

//todo: really need to retrofit all these?
//why the fuck didn't I just leave it like it wwwwasss
//https://stackoverflow.com/questions/30356148/how-can-i-use-a-single-mssql-connection-pool-across-several-routes-in-an-express

me.testRDS =  function(){
	return new Promise(function(done, fail) {
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		sreq.query("select getdate();")
			.then(function(res){
				done(res)
			}).catch(e =>{fail(e)})
	})
}

var insert_families =  function(){
	return new Promise(function(done, fail) {
		console.log("inserting families...");
		var promises = [];
		families.forEach(f=>{
			console.log(f.id,f.name);
			var poolRDS = db.getPoolRDS()
			var sreq = new sql.Request(poolRDS);
			var qry = "IF NOT EXISTS (SELECT * FROM dbo.families WHERE name = @name) " +
				"INSERT INTO dbo.families(id,name) OUTPUT inserted.id, inserted.name VALUES(@id,@name) " +
				"else select * from dbo.families WHERE name = @name";
			sreq.input("id", sql.Int, f.id);
			sreq.input("name", sql.VarChar(255), f.name);
			promises.push(sreq.query(qry))
		})
		Promise.all(promises)
			.then(function (res) {
				done(res);
			}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}

var insert_family_genre =  function(ob){
	return new Promise(function(done, fail) {
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		//exec insert_family_genres @family_name = 'electro house',@genre_name = 'indietronica';
		sreq.input("family_name", sql.VarChar(255), ob.family_name);
		sreq.input("genre_name", sql.VarChar(255), ob.genre_name);
		sreq.input("source", sql.VarChar(50), ob.source);
		sreq.input("matched", sql.VarChar(50), ob.matched);
		sreq.execute("insert_family_genres").then(function (res) {
			//testing: changed this from the res, but it had consequences..
			ob.id = ob.genre_id || 'ob'
			done(ob);
		}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}

var insertStaticGenres =  function(){
	return new Promise(function(done, fail) {

		console.log("inserting static genres...",Object.keys(genreFam_map).length);
		var promises = [];
		//todo: just going to the 'first' one
		//as I've mentioned before not sure this is really the way to go here but ¯\_(ツ)_/¯
		Object.keys(genreFam_map).forEach(g => {
			promises.push(insert_genre(g,'insertStaticGenres'))
		})
		Promise.all(promises)
			.then(function (res) {
				done(res);
			}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}

var createFamilyBinds =  function(){
	return new Promise(function(done, fail) {
		console.log("creating family binds...");
		var promises = [];
		//todo: just going to the 'first' one
		//as I've mentioned before not sure this is really the way to go here but ¯\_(ツ)_/¯
		Object.keys(genreFam_map).forEach(g => {
			var ob = {family_name:genreFam_map[g][0],genre_name:g,source:'SpotifyDefault'}
			//console.log(ob);
			promises.push(insert_family_genre(ob))
		})
		Promise.all(promises)
			.then(function (results) {
				results.forEach(r =>{
					r.recordset ? console.log(r.recordset):{};
				});
				done(results);
			}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}


// setTimeout(e =>{
// 	setGenresQualifiedMap()
// 		.then(r =>{
// 			console.log("db_api set genresQualifiedMap");
// 		},e =>{
// 			console.error("db_api set genresQualifiedMap FAILURE");
// 		})
// },2000)


//in order to avoid doing a lot of experimentation within sql w/ string matching and such, i'm just going to store this map
//in memory for now
var setFG =  function(){
	return new Promise(function(done, fail) {
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		sreq.execute("getFamilyGenreMap").then(function (res) {
			res.recordset.forEach(r =>{
				me.genreNameFamilyIdMap[r.genre_name] = r.family_id;
				//todo: need a fam -> genre map or no?
				me.familyMap[r.family_id] = r.family_name

			})
			// console.log("$genreNameFamilyIdMap",me.genreNameFamilyIdMap);
			console.log("$genreNameFamilyIdMap has been set in memory");
			//console.log(me.familyMap);
			//console.log(res.recordset);
			done(res);
		}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}



me.insert_families = insert_families;
me.createFamilyBinds = createFamilyBinds;
me.insertStaticGenres = insertStaticGenres;
me.setFG = setFG;

me.genreNameFamilyIdMap = {};
me.familyMap = {};

//the utilized SP checkForArtistGenres can handle both types of artist ids
//expects artist.ids
var checkDBForArtist;
//this does a 0 check against genres, and if it doens't find any, you don't get any records back
//so not really the best named function..

//UPDATE
//changed SP checkForArtistGenres to return even with null genres
//but we handle that possibility now instead of just no records

module.exports.checkDBForArtist = checkDBForArtist = function(artist){
	return new Promise(function(done, fail) {

		//console.log("in",artist.id);
		//console.log("qry",qry);
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		var sres = {payload:[],db:[],lastLook:[]};

		sreq.input("artistId", sql.VarChar(50), artist.id);
		sreq.execute("checkForArtistGenres").then(function(res){
			if(res.recordset.length > 0){
				//console.log(res.recordset);
				//we're fetching artist join on genres.

				//if lastLook isnt but there IS a record populated,
				// we recorded a failure at some point in the past, skip this
				//todo: make this a time-sensitive expiration (when we have more than 1 service to feed from)

				if(res.recordset[0].lastLook !== null){
					var oneNull =res.recordset[0];
					console.log("",oneNull.displayName + " lastLook: " + oneNull.lastLook);
					sres.lastLook.push(artist)
				}
				else{
					//testing: if there's only 1 row and the genres null
					//we have a record but no genres. I thiiink this is the only case right?
					//not like there could be someone returning with > 1 record w/ null genres, right?
					artist.genres = [];

					if(res.recordset[0].genre_id === null){
						//skip genres processing
					}else{
						res.recordset.forEach(function(match){
							artist.genres.push({id:match.genre_id,name:match.genre_name,family_id:match.family_id,family_name:match.family_name})
						});
					}

					//these were genre-joins, so pick any record for artist info
					artist.name = res.recordset[0].displayName || res.recordset[0].name
					artist.identifier = res.recordset[0].identifier;
					artist.id = res.recordset[0].id;
					//artist.id === '2Ceq5nkABzryK0OkaQYtzg' ? console.log(artist):{};
					//testing: recent addition to these returns for recentlyPlayed
					artist.images = JSON.parse(res.recordset[0].images);
					sres.db.push(artist)
				}
			}
			//we've never seen this id before
			else{
				//console.log("push");
				sres.payload.push(artist)
			}
			done(sres);
		}).catch(function(err){
			console.error("checkDBForArtist failure",err);
			fail(err)
		})
	})
};

//this should be able to handle both spotify and songkick artists
//todo: when I do songkick later make sure to follow the playob convention

/**
 * checkDBForArtistGenres
 * @param playob
 * @param key
 * @returns A payload creation / db reporting object that looks like
 * {artists:[],payload:[],db:[]}
 */

//note: HEY THIS IS MUTATING THE playob[key] !!!!
module.exports.checkDBForArtistGenres =  function(playob,key){
	return new Promise(function(done, fail) {
		var artists = playob[key];
		var songkickIds = true;

		if(artists[0]){
			//console.log(artists[0]);
			typeof artists[0].id == "string" ? songkickIds = false:{};
			//console.log("process set of " + (songkickIds ? "songkickIds":"spotifyIds"));
		}

		var promises = [];

		//console.log(artists[0]);
		artists.forEach(function(a){
			promises.push(checkDBForArtist(a))
			//a.id == "0qzzGu8qpbXYpzgV52wOFT" ? console.log(a):{};
			//a.id == "18H0sAptzdwid08XGg1Lcj" ? console.log(a):{};
		});

		Promise.all(promises).then(results => {
			//todo: accidentally set this up checkDBForArtist to do many artists
			//so weird aggregation here

			// console.log("$results",app.jstr(results));
			//console.log("results",results.length);
			//todo: this is also just a weird place to be defining what a playob is, right?

			if(key == 'payload'){
				//note: b/c checkDBForArtist mutates, we don't need to do anything here

				// console.log("set spotifyArtistsResolved");
				// var payloadResolved = [];
				// results.forEach(function(r){
				// 	payloadResolved = payloadResolved.concat(r.payload)
				// });
				// playob.payloadResolved = payloadResolved;
			}
			else{
				var agg = {payload:[],db:[],lastLook:[]}
				results.forEach(function(r){
					agg.payload = agg.payload.concat(r.payload)
					agg.db = agg.db.concat(r.db)
					agg.lastLook =  agg.lastLook.concat(r.lastLook)
				});
				Object.assign(playob,agg);
				//console.log(app.jstr(playob.db[0]));
			}
			done(playob);

		}).catch(err =>{
			console.error(err);
			fail(err);
		})
	})
};

/**
 * commitPlayobs
 * commit the newly spotify-sourced artists into the database
 * in the process, create new / retrieve genre-id pairs for the genres
 * */

//receives a list of artist where each one has an array of string genres
//attempt to insert each genre: either its a successful insertion or we just
//retrieve the genre-id tuple already registered for that string genre


//feature: currently always returns with nothing
//the idea being that the db will have everything we need

me.commitArtistGenres =  function(artists) {
// me.commitArtistGenres_fake =  function(artists) {
	return new Promise(function (done, fail) {
		//testing: I guess fuck the sql cache for now
		//tried playing around and making a SP (insert_artists2)
		//but didn't effect speed at all.
		//console.log("commitArtistGenres IS DISABLED!");
		done()
	})
}

me.commitArtistGenre_orig =  function(artists) {
// me.commitArtistGenres =  function(artists) {
	return new Promise(function (done, fail) {

		console.log("commitArtistGenres",artists.length);
		//console.log(JSON.stringify(artists[0].genres));
		//submit genres, annotating the incoming object with ids created or fetched
		//insert artists and genre_artist relations

		var gpromises = [];
		var unique = []
		artists.forEach(function (a) {
			!(a.genres) ? console.warn("artist w/ no genres to submit"):{};
			if(!(a.genres)){
				console.log(a);
			}
			//either the artist has genres or it doesn't - if not we just skip it
			//later on again we'll just skip it...

			a.genres.forEach(g => {
				//todo: pretty sure theres a timing issue here causing me to register some
				//exact same value genres twice. so just going to prune for uniqueness here
				if (unique.indexOf(g) === -1) {

					//todo: soooommhow genres coming back from these artists
					//if(g.id){console.log(g);}
					gpromises.push(insert_genre(g));
					unique.push(g)
				}
			})
		})

		//if we inserted any genres, we'll then insert artists and artist-genres pairs
		Promise.all(gpromises).then(r => {
				//console.log("$r",app.jstr(r));
				console.log("genres inserted",r.length);

				//mutate playobs with qualified genres
				//we'll have this if none of the artists had an genres to insert

				if(r.length){

					//reduce results to a huge array
					// var genres = r.reduce(function (prev, curr) {
					// 	return prev.concat(curr);
					// });
					//create a map where the string genre is the key = genre-id pair
					//todo: I fucked up a refactor
					//so now this could be two types of genre objects:
					// {
					// 	"id": 1129,
					// 	"name": "permanent wave"
					// }
					// {
					// 	"genre_id": 40,
					// 	"genre_name": "pop punk",
					// 	"family_id": 1,
					// 	"family_name": "pop"
					// }
					var map = {};
					r.forEach(g => {
						g.name ? map[g.name] = g:{};
						g.genre_name ? map[g.genre_name] = g:{};
					});

					var apromises = [];
					var gapromises = [];
					//fully qualify the string genres by replacing with mapped value
					artists = _.uniqBy(artists,'id')
					artists.forEach(function (a) {
						var gs = [];
						a.genres.forEach(g => {
							gs.push(map[g])
						})
						a.genres = gs;

						//push artists and artist_genres
						apromises.push(insert_artist(a));

						a.genres.forEach(function (g) {
							var ag = {genre_id: g.id ? g.id:g.genre_id, id: a.id}
							gapromises.push(insert_genre_artist(ag));
						});
					})

					//apromises.push(insert_artists(artists));

					//todo: no idea why this takes so long compared to insert_genre_artist
					console.log("insert_artist ...",apromises.length);

					Promise.all(apromises).then(function (r2) {
						console.log("insert_genre_artist ...",gapromises.length);

						Promise.all(gapromises).then(function (r2) {
							console.log("insert genres, artists and artist_genres finished");
							done();
						})
					})
				}//if r
				else{
					console.log("no artists had genres to commit");
					done();
				}
			},
			e => {
				console.log(e);
				fail(e)
			})
	})
}

me.commitPlayobs =  function(playobs) {
	return new Promise(function (done, fail) {

		//submit genres, annotating the incoming object with ids created or fetched
		//insert artists and genre_artist relations

		var rpromises = [];
		var skipped = 0;
		playobs.forEach(function (p) {
			//since even we send playobs with only db fetched artists here as well
			//just make them fail fast since they won't have this spotifyArtists field
			//but throw this value on here for easy aggregation later
			if (!p.spotifyArtists) {
				p.spotifyArtists = [];
				skipped++
				//todo: why were we originally sending these just to come back empty?
			}else{
				rpromises.push(me.commitArtistGenres(p.spotifyArtists));
			}
			Promise.all(rpromises).then(r => {
				console.log("commitPlayobs finished",r.length);
				console.log("skipped:", skipped);
				//console.log(r)
				done()
			})
		})
	})
}

//incoming object looks like:
// {
// 	id: '1xD85sp0kecIVuMwUHShxs',
// 	name: 'Twin Peaks',
// 	artistSongkick_id: 296530,
// 	displayName: 'Twin Peaks',
// 	genres: []
// 	}

//made genres optional for use of this after checking spotify
//todo: maaaybe getting too messy due to lazyness

module.exports.commit_artistSongkick_with_match =   function(songkickOb) {
	return new Promise(function (done, fail) {
		//console.log("$artist", songkickOb);

		var artistSongkick = {id: songkickOb.artistSongkick_id, displayName: songkickOb.displayName};
		var artist_artistSongkick = {artist_id: songkickOb.id, artistSongkick_id: songkickOb.artistSongkick_id};

		async function commit() {
			//todo: confused whether this is necessary always here?
			await insert_artistSongkick(artistSongkick);
			await insert_artist_artistSongkick(artist_artistSongkick);

			//these requests come from spotify->songkick string matching successes
			//even if there were no genres pulled, we will still record newly exposed spotify artist
			//as we need to to make the above connection valid anyways
			if(songkickOb.newSpotifyArtist){
				//var newSpot = {id:songkickOb.newSpotifyArtist.id, name:songkickOb.newSpotifyArtist.name,uri:songkickOb.newSpotifyArtist.uri}
				await insert_artist(songkickOb.newSpotifyArtist);

				//todo: how does await work here?

				//these are artist-artistSongkick matches
				//we will store the genres obtained from the successful spotify lookup if it got any
				if (songkickOb.genres.length > 0) {
					var gpromises = [];
					var apromises = [];

					songkickOb.genres.forEach(g => {
						gpromises.push(insert_genre(g))
					});
					Promise.all(gpromises).then(r => {
						//console.log("1===========");
						//console.log(r);
						//var genres = r.reduce(function(prev, curr) { return prev.concat(curr); });
						//console.log(r);
						//console.log(genres);
						r.forEach(g => {
							//todo: somewhere up the chain here I'm returning two types of objects:
							//one has my new 'match' field and creation and all that - the other has the normal bits
							//I currently can't remember for shit where this happens at...
							//I know I made this change in insert_family_genres b/c I was thinking that it would make sense
							//to come back and paramterize all of these types of inserts with that info

							// if(g.id){
							// 	var ag = {genre_id: g.id, id: songkickOb.id}
							// }else{
							// 	var ag = {genre_id: g.genre_id, id: songkickOb.id}
							// }


							if(typeof g.id === "string"){console.log(g); throw 'no id'}
							var ag = {genre_id: g.id, id: songkickOb.id}

							apromises.push(insert_genre_artist(ag));
						});

						//await Promise.all(apromises)
						Promise.all(apromises).then(r => {
							//console.log("2===========");
							//console.log(r);
							return r;

						}, e => {console.log(e);})
					}, e => {console.log(e);})
				}//genres.length

			}
		}

		commit().then(r => {
			//console.log("3===========");
			//console.log(r);
			done(r);
		}, e => {
			console.error(e);
		})
	})};


//todo: arbitrary limit here not sure what to do with this yet
const levenMatchLimit = 5;

//attempt to establish a new link between a spotify and songkick artist purely based on the provided names
//will attempt to return with genres from spotify but NOT songkick because we already checked on that in
//checkDBFor_artistSongkick_match

module.exports.checkDBForArtistLevenMatch =  function(artist){
	return new Promise(function(done, fail) {
		// console.log("$artist",artist);

		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		//var sres = {payload:[],db:[],lastLook:[]};

		sreq.input("name", sql.VarChar(50), artist.name);
		sreq.input("id", sql.Int, artist.id);
		sreq.execute("levenMatch").then(function(res){
			var r0 = res.recordset[0];
			//var ret = {id:r.id,name:r.name,artistSongkick_id:r.artistSongkick_id,displayName:r.displayName,genres:[]}
			var ret = Object.assign({}, artist);
			ret.genres = [];

			//they are sorted by levenMatch so index [0] will be the best we can do
			if(res.recordset.length > 0 && r0.levenMatch !== null && r0.levenMatch < levenMatchLimit) {
				//console.log(res.recordset);
				res.recordset.forEach(rec => {
					ret.genres.push({id:rec.genre_id,name:rec.genre_name})
				})
			}
			//todo: just fail it and catch in a reflect?
			else{
				Object.assign({error:"no good match"},ret);
			}
			done(ret)
		}).catch(err =>{
			//console.error(err);
			fail(err);
		})
	})
};

//note this goes to see if we can find an artist_artistSongkick match using only the artistSongkick_id supplied
//if it finds a match, it will attempt to join on spotify OR songkick's known genres
module.exports.checkDBFor_artist_artistSongkick_match =  function(artist){
	return new Promise(function(done, fail) {
		//console.log("checkDB",artist);
		//console.log("$artist",artist);
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);

		sreq.input("artistSongkick_id", sql.Int, artist.id);
		//console.log(sreq.parameters);

		//todo: this has sort of a weird return pattern
		//basically since we're really returning genres, some other info is coded into each one
		//which we then ignore when we set genres and pull out of 'any' record
		sreq.execute("match_artist_artistSongkick")
			.then(r => {
				//debugger;
				//console.log(artist.id + " results: ",r.recordset.length);
				var ret = Object.assign({}, artist);
				ret.genres = [];
				if(r.recordset.length > 0) {
					r.recordset.forEach(rec => {
						//console.log(rec);
						ret.genres.push({id:rec.genre_id,name:rec.genre_name,family_id:rec.family_id,family_name:rec.family_name})
					});
					ret.artistSongkick_id = r.recordset[0].artistSongkick_id
					ret.id = r.recordset[0].id
				}

				//console.log(ret);
				util.familyFreq(ret);
				done(ret)
			}).catch(err =>{
			//console.error(err);
			fail(err);
		})
	})
};

//todo: just a shell rn
//just check for already known genres associated with a songkick object
module.exports.checkDBFor_artistSongkick_match =  function(artist){
	return new Promise(function(done, fail) {

		//console.log("$artist",artist);
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);

		sreq.input("artistSongkick_id", sql.Int, artist.id);
		//console.log(sreq.parameters);
		sreq.execute("match_artistSongkick")
			.then(r => {
				//console.log("$r",r.recordset);
				var ret = Object.assign({}, artist);
				ret.genres = [];
				if(r.recordset.length > 0) {
					r.recordset.forEach(rec => {
						ret.genres.push({id:rec.genre_id,name:rec.genre_name})
					})
				}
				console.log(ret);
				done(ret);
			}).catch(err =>{
			//console.error(err);
			fail(err);
		})
	})
};


module.exports.qualifyGenre =  function(g){
	return new Promise(function(done, fail) {
		insert_genre(g)
			.then(r =>{
				g = r;
				done(r);
			})
	})
}

/**
 * Attempts to insert a string genre if it doesn't exist already
 * @param genre
 * @returns with a fully qualified genre (either newly created or already known)
 */
var insert_genre = function (genre, phase) {
	return new Promise(function (done, fail) {
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);

		//check current map for genre name resolution to add on to genre insert

		var qry = "IF NOT EXISTS (SELECT * FROM dbo.genres WHERE name = @name) " +
			"INSERT INTO dbo.genres(name) OUTPUT inserted.id, inserted.name VALUES(@name) " +
			"else select * from dbo.genres WHERE name = @name";
		sreq.input("name", sql.VarChar(255), genre);
		sreq.query(qry).then(function (res) {

			//todo: if the genre exists, we really shouldn't be taking this step
			//need to make a SP for genre insert and return whether or not we added in a new one

			//every if/else lands on returning with this original result (modified or not)

			if(phase){
				//skip this during static fill
				// console.warn("skipping family assignment during",phase)
				done(res.recordset[0]);
			}else{
				var fid = me.genreNameFamilyIdMap[genre] || null;

				//modifies recordset returned from genre_insert w/ newly minted family id and and returns it

				var commit =  function(res,fid){
					var fg = {
						genre_id:res.recordset[0].id,
						genre_name:res.recordset[0].name,
						family_id:fid,
						family_name:me.familyMap[fid]
					};
					//todo: match => matched :/
					res.match ? fg.matched = res.match:{};
					res.source ? fg.source = res.source:{}
					return insert_family_genre(fg)
					//return new Promise(function(done, fail) {
					// var sreq2 = new sql.Request(app.poolGlobal);
					// var qry = "IF NOT EXISTS (SELECT * FROM dbo.genre_family WHERE genre_id = @genre_id) " +
					// 	"INSERT INTO dbo.genre_family(genre_id,family_id) OUTPUT inserted.genre_id, inserted.family_id VALUES(@genre_id,@family_id) " +
					// 	"else select * from dbo.genre_family WHERE genre_id = @genre_id";
					//
					// sreq2.input("genre_id", sql.Int, res.recordset[0].id);
					// sreq2.input("family_id", sql.Int, fid);
					//return sreq2.query(qry)

					//but also, as a result of parsing this newly generated genres list for a songkick artist and creating a genre_family link,
					//we also need to
					//create
					// })
				};

				if(fid){
					//console.log("$known fid",fid);
					res.source = 'SpotifyDefault'
					commit(res,fid)
						.then(function (res) {
							//todo: who needs this?
							res.family_id = fid;
							res.id = res.genre_id || 'res'
							done(res);
						})
				}else{

					//console.log("TODO: attempt to find new family");

					//fid was looking for an exact genre match. now:

					//split the genre string and detect substrings that:
					//1) X match directly on a genre_name
					//2) X match directly on a family_name
					//3) X match some special inference based on input genre
					//4) match on a partial genre_name (substrings to substring genre_name)


					//special rules
					//todo: indie = indie rock?
					var specialLogic = {};
					specialLogic["rap"] = "hip hop";
					specialLogic["electronic"] = "electro house"

					//temp reverse map
					var locmap = {};
					Object.keys(me.familyMap).forEach(id =>{
						locmap[me.familyMap[id]] = id;
					})

					function getLike(g){
						//console.log("$",JSON.stringify(g));
						var match = null;
						//console.log(f);
						//split the unknown genre at \s and try to find it's keys in our family names
						var gkeys = g.split(" ");

						//add on contrived keys
						gkeys.forEach((k, i, arr) => {
							if (specialLogic[k]) {
								arr.push(specialLogic[k])
							}
						})
						gkeys.forEach(k => {
							//for each family, can we find a key as a substring?
							//return after the first match
							Object.keys(locmap).forEach(f => {
								if (f.indexOf(k) !== -1 && (!match)) {
									//console.log("match: " + g + " to " + f + " on " + k)
									!(match)?match=f:{};
								}
							})
						})

						if(match){
							//g === "electronic trap" ? console.log("$match: " + match + " | " + genre):{};
							//console.log("$match: " + match + " | " + genre);
							return {match:match,fid:locmap[match]}
						}
						else{
							//testing:
							//console.log("$no match",genre);
							return null
						}
					}

					//var t =  Object.keys(locmap);
					//console.log(Object.keys(locmap));

					var likeRes = getLike(genre);
					// console.log(me.familyMap);
					// var familyName = getLike(genre)
					// console.log("$m1",familyName);


					if(likeRes && likeRes.fid){
						res.source = "getLike";
						res.match = likeRes.match;
						commit(res,likeRes.fid)
							.then(function (res) {
								//todo: again who is looknig for this?
								res.family_id = likeRes.fid;
								res.id = res.genre_id || 'getLike'
								done(res);
							})
					}else{
						done(res.recordset[0]);
					}
				}
			}
		}).catch(function (err) {
			//console.log(err);
			fail(err);
		})
	})
};

var insert_artist =  function(artist){
	return new Promise(function(done, fail) {

		//console.log("$$artist",app.jstr(artist));

		var del = ["external_urls","href","genres","type"]
		var a = Object.assign({},artist);
		del.forEach(p =>{	delete a[p]});


		//todo: make this string json for now
		a.images = JSON.stringify(a.images);
		//parsing followers to int (also has a null href?)
		a.followers = a.followers.total || null;
		//a.popularity = a.popularity;

		var keys = Object.keys(a);
		var klist = keys.map(function(value){
			return "" + value + ""
		}).join(",");
		var kparams = keys.map(function(value){
			return "@" + value + ""
		}).join(",");

		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		sreq.input("id",  sql.VarChar(50), a.id);
		sreq.input("name", sql.VarChar(50), a.name);
		sreq.input("images", sql.VarChar(), a.images);
		sreq.input("followers", sql.Int, a.followers);
		sreq.input("popularity", sql.Int, a.popularity);
		sreq.input("uri", sql.VarChar(100), a.uri);

		var qry = "IF NOT EXISTS (SELECT id FROM dbo.artists WHERE id = @id)"
			+ " INSERT INTO dbo.artists("+ klist + ")"
			+ " OUTPUT inserted.id, inserted.name, inserted.images, inserted.followers, inserted.popularity, inserted.uri"
			+ " VALUES(" + kparams +")"
			+ " else select * from dbo.artists WHERE id = @id";

		sreq.query(qry).then(function(res){
			//we already have ids
			//even if we didn't know about the artist, nothing to return here
			//console.log(res);

			done();
		}).catch(function(err){
			console.log(err);
		})
	})
}

//todo: broken attempt at big query insert (also, check this works on ms-server)
//https://stackoverflow.com/questions/452859/inserting-multiple-rows-in-a-single-sql-query
var insert_artists =  function(artists){
	return new Promise(function(done, fail) {

		//console.log("$$artist",app.jstr(artist));

		var valuesString = " VALUES "


		artists.forEach(artist =>{
			var del = ["external_urls","href","genres","type"]
			var a = Object.assign({},artist);
			del.forEach(p =>{	delete a[p]});

			//keys.length === 0 ? keys = Object.keys(a):{};

			//todo: make this string json for now
			a.images = JSON.stringify(a.images);
			//parsing followers to int (also has a null href?)
			a.followers = a.followers.total || null;

			var values = [a.id, a.name,a.images,a.followers,a.popularity,a.uri]
			values.forEach((v,i,arr)=>{
				if(!(typeof v === "number")){
					arr[i] = '"' + v.toString() + '"'
				}

			})
			values = values.join(",")
			valuesString = valuesString + "(" + values +"),"
		})

		var keys = ["id","name","images","followers","popularity","uri"];
		var klist = keys.map(function(value){return "" + value + ""}).join(",");
		valuesString = valuesString.substring(0, valuesString.length - 1);

		var qry = ""
			+ "INSERT INTO dbo.artists("+ klist + ")"
			+ " OUTPUT inserted.id, inserted.name, inserted.images, inserted.followers, inserted.popularity, inserted.uri"
			+ valuesString

		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);

		//todo: idk this was a waste of time probably
		//just doesnt ever come back right now
		//+ would need insert to check for existence

		sreq.query(qry).then(function(res){
			//we already have ids
			//even if we didn't know about the artist, nothing to return here
			//console.log(res);
			done();
		}).catch(function(err){
			console.log(err);
		})
	})
}

//todo: setup to handle both songkick and spotify
//they look like: {genre_id:#,artist_id:"",artistSongkick_id}
//so whatever's not present is what to submit i.e. up to function that calls this to set that up

let insert_genre_artist = function (genreArtist) {
	var klist = "genre_id,artist_id";
	var kparams = "@genre_id,@artist_id";

	var poolRDS = db.getPoolRDS()
	var sreq = new sql.Request(poolRDS);
	sreq.input("genre_id", sql.Int, genreArtist.genre_id);
	sreq.input("artist_id", sql.VarChar(50), genreArtist.id);
	//sreq.input("artistSongkick_id", sql.Int(), artist.id);

	var qry = "IF NOT EXISTS (SELECT * FROM dbo.genre_artist WHERE genre_id = @genre_id and artist_id = @artist_id)"
		+ " INSERT INTO dbo.genre_artist(" + klist + " )"
		+ " OUTPUT inserted.genre_id, inserted.artist_id"
		+ " VALUES(" + kparams + ")"
		+ " else select * from dbo.genre_artist WHERE genre_id = @genre_id and artist_id = @artist_id";

	sreq.query(qry).then(function (res) {
		//console.log(res);
	}).catch(function (err) {
		console.log(err);
	})
};

var insert_artistSongkick =  function(artistSongkick){
	return new Promise(function(done, fail) {

		//let a = {id:4,displayName:"testDisplayName",identifier:"test-mbei-233r-asfsdf-dfdsasfd"};

		var keys = Object.keys(artistSongkick);
		var klist = keys.map(function(value){
			return "" + value + ""
		}).join(",");
		var kparams = keys.map(function(value){
			return "@" + value + ""
		}).join(",");

		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		sreq.input("id", sql.Int, artistSongkick.id);
		sreq.input("displayName", sql.VarChar(100), artistSongkick.displayName);

		//todo: sreq.input("identifier", sql.VarChar(150), a.identifier);
		//todo: sreq.input("onTourUntil", sql.DateTimeOffset(7), as.onTourUntil)

		var qry = "IF NOT EXISTS (SELECT * FROM dbo.artistsSongkick WHERE id = @id)"
			+ " INSERT INTO dbo.artistsSongkick("+ klist + ")"
			+ " OUTPUT inserted.id, inserted.displayName, inserted.identifier"
			+ " VALUES(" + kparams +")"
			+ " else select * from dbo.artistsSongkick WHERE id = @id";

		sreq.query(qry).then(function(res){
			//console.log(res);
			done(res);
		}).catch(function(err){
			console.log(err);
		})
	})
}

var insert_artist_artistSongkick =  function(artist_artistSongkick){
	return new Promise(function(done, fail) {
		var poolRDS = db.getPoolRDS()
		var sreq = new sql.Request(poolRDS);
		sreq.input("artist_id", sql.VarChar(150), artist_artistSongkick.artist_id);
		sreq.input("artistSongkick_id",sql.Int, artist_artistSongkick.artistSongkick_id);
		var qry2 = "insert into artist_artistSongkick(artist_id, artistSongkick_id) values (@artist_id, @artistSongkick_id)";
		sreq.query(qry2).then(function(res){
			//console.log(res);
			done(res);
		}).catch(function(err){
			console.log(err);
		})
	});
}




