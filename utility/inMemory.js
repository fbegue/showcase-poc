//in order to avoid doing a lot of experimentation within sql w/ string matching and such, i'm just going to store this map
//in memory for now
let sql = require("mssql");
var me = module.exports;
me.genreNameFamilyIdMap = {};
me.familyMap = {};
me.familyMapName = {};
setFG =  function(poolRDS){
	return new Promise(function(done, fail) {
		var sreq = new sql.Request(poolRDS);
		sreq.execute("getFamilyGenreMap").then(function (res) {
			res.recordset.forEach(r =>{
				me.genreNameFamilyIdMap[r.genre_name] = r.family_id;
				//todo: need a fam -> genre map or no?

				me.familyMap[r.family_id] = r.family_name
				me.familyMapName[r.family_name] = r.family_id
			})

			// console.log("$genreNameFamilyIdMap",me.genreNameFamilyIdMap);
			console.log("$genreNameFamilyIdMap has been set in memory");
			console.log("$familyMap has been set in memory");
			console.log("$familyMapName has been set in memory");

			//console.log(me.familyMap);
			//console.log(res.recordset);
			done(res);
		}).catch(function (err) {
			console.error(err);
			fail(err);
		})
	})
}

var getGenres =  function(poolRDS){
	return new Promise(function(done, fail) {
		var sreq = new sql.Request(poolRDS);
		let gQry = "select g.id,g.name as name,f.id as family_id, f.name as family_name" +
			" from genre_family gf join genres g on gf.genre_id=g.id join families f on f.id = gf.family_id"
		sreq.query(gQry).then(function (res) {
			done(res.recordset);
		}).catch(function (err) {
			//console.log(err);
			fail(err);
		})
	})
}

me.setGenresQualifiedMap =  function(pool){
	return new Promise(function(done, fail) {
		getGenres(pool)
			.then(genres => {
				module.exports.genresQualifiedMap = {};
				genres.forEach(g => {
					module.exports.genresQualifiedMap[g.name] = g
				})
				setFG(pool).then(r =>{
					console.log("setInMemory finished");
					done("setGenresQualifiedMap")
				},e =>{fail(e)})

			},e =>{fail(e)})
	})
}
me.getGenresQualifiedMap =  function(){
	return me.genresQualifiedMap;
}
