// var jsonInputPath  = "./octoparse-results/songkick-columbus.20240721.json"
var jsonInputPath  = "./octoparse-results/Songkick-SaltLakeCity.20241027.json"
//var jsonInputPath  = "./octoparse-results/songkick-santa-fe.20231206.json"

var jsonInput = require(jsonInputPath)
const fs = require('fs');
const { DateTime } = require("luxon");

/**
 * @desc Given output from a specific octoparse script, remap entries into a legacy format that the rest
 * of this backend understands
 * @param jsonInput
 * ex input:  songkick-columbus.20240310.json
 * ex output: songkick-columbus.20240310.OUTPUT.json
 */
const mapOctoparseOutputToSongkickEvents = async function(jsonInput){
    try{
		//Use async / await
		let songkick_events = [];

		console.log(`processing ${jsonInput.length} events`)

		//todo: when I started pulling Field10, somehow introduced erroneous empty row
		jsonInput = jsonInput.filter((r)=>{return r.event_name !== ""})

		jsonInput.forEach((r,i) =>{

			try{

				//note: targets:
				// "date":"2022-11-12"
				// "time":"23:00:00"

				// const regex_datetime = /datetime="(.*)"><\/time>/gm;
				// var datetime = regex_datetime.exec(r.Field)[1];
				// const regex_date = /(\d*\-\d*\-\d*)T/gm;
				// //console.log("eventLink",r.eventlink)
				// var res =  regex_date.exec(datetime);
				// var date = res ? res[1]:datetime;



				//let ex_datetime = "2023-11-16T19:00:00-0500"
				const luxon_datetime = DateTime.fromISO(r.datetime_html_regex)
				const luxon_time_local = luxon_datetime.toLocaleString(DateTime.TIME_24_WITH_SECONDS,{})
				const luxon_date_local = luxon_datetime.toLocaleString(DateTime.DATE_SHORT,{}).replaceAll("/","-")

				// var regex_script = / <script type="application\/ld\+json">(.*)<\/script>/gm;
				// var string_script = regex_script.exec(r.Field)[1]
				// var parsed_script = JSON.parse(string_script)[0]

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



				r.context_array_parsed = JSON.parse(r.Field10)


				//need to map performers_array_parsed to soundfound-acceptable objects
				//note: context_array is always a single member array
				var performance = r.context_array_parsed[0].performer.map((p,i2) =>{
					const pattern = /(?:artists\/)(\d+)-[a-zA-Z0-9-]+/;
					const match = p.sameAs.match(pattern);
					let artistId;
					if (match) {
						artistId = parseInt(match[1])
					}
					else{
						console.error("songkick artistid parse failure",p)
						debugger
					}

					return {
						"id":artistId,
						"displayName": p.name,
						"billing": "unknown",
						"billingIndex": 1,
						"artist": {
							"id":  artistId,
							"displayName": p.name,
							"uri": p.sameAs,
						}
					}
				})


				const songkick_event = {
					"id": i + 1,
					"displayName": r.event_name,
					"uri": r.event_URL,
					"start": {
						"date": luxon_date_local,
						// "datetime": "2021-07-25T20:30:00-0400","datetime": datetime,
						"time": luxon_time_local
					},
					"performance":performance,
					"venue": {
						"id": getPid(30001,40000),
						"displayName": r.context_array_parsed[0].location.name,
						"uri": "https://www.songkick.com/venues/36816-summit?utm_source=47817&utm_medium=partner",
						//todo:
						"metroArea": {
							"displayName":  r.context_array_parsed[0].location.address.addressLocality,
							"id":  r.context_array_parsed[0].location.address.postalCode,
						},
					},
					"location": {
						"city":  r.context_array_parsed[0].location.address.addressLocality + ", " + r.context_array_parsed[0].location.address.addressRegion  + ", " +  r.context_array_parsed[0].location.address.addressCountry,
						"lat":  r.context_array_parsed[0].location?.geo?.latitude,
						"lng":  r.context_array_parsed[0].location?.geo?.longitude
					}
				}

				songkick_events.push(songkick_event)

			}
			catch(e){
				debugger
			}

		})

		const path = require('path');


		const { dir, base } = path.parse(jsonInputPath);
		debugger

		let jsonOutputFileName = base.replace(".json","") + ".output.json"
		console.log(`writing output file ${dir + "/" + jsonOutputFileName}`);
		debugger
		fs.writeFileSync(dir + "/" + jsonOutputFileName,  JSON.stringify(songkick_events));


    } catch(e){
        console.error(e)
        throw(e)
    }
}

module.exports.items = mapOctoparseOutputToSongkickEvents(jsonInput)
