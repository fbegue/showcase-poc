// require csvtojson
var csv = require("csvtojson");
//var csvFilePath  = "./octo/Los_Angeles_Songkick.csv"
var csvFilePath  = "./octo/Los_Angeles_Songkick_update111222.csv"
const fs = require('fs');
const { DateTime } = require("luxon");

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

		let songkick_events = [];

		// const jsonArray_valid =jsonArray.filter(ob =>{
		// 	// const regex_datetime = /datetime="(.*)"><\/time>/gm;
		// 	// return regex_datetime.exec(r.Field)
		// 	return ob.Field
		// })


		jsonArray.forEach((r,i) =>{

			try{
				const regex_datetime = /datetime="(.*)"><\/time>/gm;
				var datetime = regex_datetime.exec(r.Field)[1];
				const regex_date = /(\d*\-\d*\-\d*)T/gm;
				//console.log("eventLink",r.eventlink)
				var res =  regex_date.exec(datetime);
				var date = res ? res[1]:datetime;
				// var date = regex_date.exec(datetime)[1];
				//var date = regex_date.exec(datetime) ? regex_date.exec(datetime)[1]:datetime;

				//todo: check local in browser?
				const luxon_datetime = DateTime.fromISO(datetime)
				// const luxon_datetime = DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
				// const luxon_datetime_local = luxon_datetime.toLocal();
				const luxon_time_local = luxon_datetime.toLocaleString(DateTime.TIME_24_WITH_SECONDS,{})

				var regex_script = / <script type="application\/ld\+json">(.*)<\/script>/gm;
				var string_script = regex_script.exec(r.Field)[1]
				var parsed_script = JSON.parse(string_script)[0]

				var pids = [];

				var getPid = (min,max) =>{
					function randomIntFromInterval(min, max) { // min and max included
						return Math.floor(Math.random() * (max - min + 1) + min)
					}
					var pid =randomIntFromInterval(min, max)
					if(pids.indexOf(pid) === -1){
						pids.push(pid);return pid;
					}

					else {
						getPid (min,max)}
				};
				var performance = parsed_script.performer.map((p,i2) =>{
					return {
						"id": getPid(10000,20000),
						"displayName": p.name,
						"billing": "unknown",
						"billingIndex": 1,
						"artist": {
							"id":  getPid(20001,30000),
							"displayName": p.name,
							"uri": p.sameAs,
						}
					}
				})


				const songkick_event = {
					"id": i + 1,
					"displayName": r.eventlink,
					"uri": r.eventlink_URL,
					"start": {
						"date": date,
						// "datetime": "2021-07-25T20:30:00-0400","datetime": datetime,
						"time": luxon_time_local
					},
					"performance":performance,
					"venue": {
						"id": getPid(30001,40000),
						"displayName": parsed_script.location.name,
						"uri": "https://www.songkick.com/venues/36816-summit?utm_source=47817&utm_medium=partner",
						//todo:
						"metroArea": {
							"displayName": parsed_script.location.address.addressLocality,
							"id": parsed_script.location.address.postalCode,
						},
					},
					"location": {
						"city": parsed_script.location.address.addressLocality + ", " +parsed_script.location.address.addressRegion  + ", " + parsed_script.location.address.addressCountry,
						"lat": parsed_script.location?.geo?.latitude,
						"lng": parsed_script.location?.geo?.longitude
					}
				}

				songkick_events.push(songkick_event)
			}catch(e){
				debugger
			}

		})
		debugger
		console.log(songkick_events.length)
		fs.writeFileSync('Los_Angeles_Songkick_parsed__update111222.json',  JSON.stringify(songkick_events));

    } catch(e){
        console.error(e)
        throw(e)
    }
}

module.exports.items = run()
