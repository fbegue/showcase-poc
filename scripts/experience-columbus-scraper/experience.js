// require csvtojson
var csv = require("csvtojson");
var csvFilePath  = "./experiencecolumbus.csv"
const fs = require('fs');

// Convert a csv file with csvtojson


// Parse large csv with stream / pipe (low mem consumption)
// csv()
// 	.fromStream(readableStream)
// 	.subscribe(function(jsonObj){ //single json object will be emitted for each csv line
// 		// parse each json asynchronousely
// 		return new Promise(function(resolve,reject){
// 			asyncStoreToDb(json,function(){resolve()})
// 		})
// 	})

const run = async function(){
    try{
		//Use async / await
		var r = null;
		csv()
			.fromFile(csvFilePath)
			.then(function(jsonArrayObj){ //when parse finished, result will be emitted here.
				console.log(JSON.stringify(jsonArrayObj,null,4));
				//r=jsonArrayObj
			})

		const jsonArray=await csv().fromFile(csvFilePath);
		console.log(jsonArray.length)
		jsonArray.forEach(r =>{
			var notEm = (st) =>{
				// var r  = st === "";
				// var r2  = st.length !== 0
				// var r3  = st.length
				// console.log(typeof st)
			   return st !== ""
			}
			if(notEm(r.Location)){
				r.locationParsed = r.Location
			}else if(notEm(r.Location2)){
				r.locationParsed = r.Location2
			}else if (notEm(r.Location3)){
				r.locationParsed = r.Location3
			}else{
				r.locationParsed = "ERROR"
			}

		})
		console.log(jsonArray.length)
		//return
		let data = JSON.stringify(jsonArray);
		fs.writeFileSync('experienceColumbusParsed.json', data);

    } catch(e){
        console.error(e)
        throw(e)
    }
}

module.exports.items = run()
