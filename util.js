var _ = require('lodash');

//testing: method for calling endpoints from local functions
//basically just send a res that will be the callback
//and remove the .then() from it b/c it will be immediately undefined otherwise
// var req2 = {};var res2 = {send:function(d){
// 		console.log("here",d)
// 		res.send(d);
// 	}};
// me.getMySavedTracks(req2,res2)



//take every artist and look at all their genres to figure out which family best represents them
//todo: how to do tie-breakers / how to value thresholds

//todo: particularly, need to make sure that just b/c a band has a more genres defined
//that doesn't mean that it is more influential - which will be a problem for bands
//that have more than one major family name

module.exports.familyFreq = function familyFreq(a){

	try{


	var ret = null;

	//a = JSON.parse(JSON.stringify(a));
	//console.log(JSON.parse(JSON.stringify(a)));
	// console.log("familyFreq",a.genres);
	// console.log("familyFreq",a.genres.length >0);

	if(a.genres && a.genres.length >0){
		var fmap = {};
		for (var z = 0; z < a.genres.length; z++) {
			if (a.genres[z].family_name) {
				if (!(fmap[a.genres[z].family_name])) {
					fmap[a.genres[z].family_name] = 1
				} else {
					fmap[a.genres[z].family_name]++;
				}
			}
		}

		//console.log("$fmap",fmap);

		//check the family map defined and see who has the highest score
		if (!(_.isEmpty(fmap))) {
			//convert map to array (uses entries and ES6 'computed property names')
			//and find the max
			var arr = [];
			Object.entries(fmap).forEach(tup => {
				var r = {[tup[0]]: tup[1]};
				arr.push(r);
			});
			//todo: could offer this
			var m = _.maxBy(arr, function (r) {
				return Object.values(r)[0]
			});
			var f = Object.keys(m)[0];
			//console.log("%", f);
			ret = f ;
		}
	}else{
		//if
		//console.warn("no genres!",a.name);
	}
	ret ? a.familyAgg = ret:a.familyAgg = null;
	return ret;

	}catch(e){
		console.error(e);
	}
}



