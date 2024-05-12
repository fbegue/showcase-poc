// list all charts
const { listCharts,getChart } = require('billboard-top-100');
var Bottleneck = require("bottleneck");
const util = require('util')
const { DateTime } = require("luxon");
const _listCharts = util.promisify(listCharts)
const _getChart = util.promisify(getChart)

var charts;
var regex = /\/charts\/(.*)/

//testing: seemingly only hot-100
var strDate = '1970-08-27'
//testing: after making filters, only 2 don't show up
var strDate = '2021-08-27'
//testing: my bday in yyyy-mm-dd (this package's query format)/ mm-dd-yyyy (American)
var strDate = '1994-06-11'
var strDate = '06-11-1992'

var format = "MM-dd-yyyy"

//todo: subtract until
//male: 13 and 16
//female: 11 and 14
var bday = DateTime.fromFormat(strDate,format)
bday = bday.minus({years:10})
debugger
//testing: isolate uncaughtException



process.on('uncaughtException', err => {
	debugger
	// console.error('There was an uncaught error', err);
	console.error('uncaughtException');
	//process.exit(1); // mandatory (as per the Node.js docs)
});

// var chartName = 'billboard-global-excl-us'
// var chartName = 'country-digital-song-sales'
// getChart(chartName, strDate, (err, chart) => {
// 	if (err) console.log(err);
// 	console.log(chart);
// 	debugger
// })


var limiter = new Bottleneck({
	maxConcurrent: 20,
	minTime: 100,
	trackDoneStatus: true
});

async function main() {
	try {

		function getIndex(c){

			var m = c.url.match(regex)[1]
			if(m.endsWith("/")){
				m = m.substring(0,m.length -1)
			}
			return m;
		}

		charts = await _listCharts();
		charts = charts.map(c =>{return {...c,index:getIndex(c)}})
		debugger;

		//testing:

		//	var charts = [
		//"artist-100"
		// "billboard-global-200",
		// "billboard-global-excl-us",
		// "pop-songs",
		// "adult-pop-songs",
		// "classical-albums",
		// "classical-crossover-albums",
		// "traditional-classic-albums",
		// "song-breaker",
		// "country-songs",
		// "country-albums"
		//];
		// charts = charts.map(c =>{return {index:c}})
		// console.warn("charts override",charts.length);


		//testing:
		var exceptionsWords = ['bandsintown','greatest']
		//these aren't cataloged by date (logically, makes sense)
		var dateNAIndexes = [ "song-breaker" , "artist-100"]
		var proSubscriberIndexes = ["social-50","emerging-artists", "dance-club-play-songs"]

		var exclusions = exceptionsWords.concat(proSubscriberIndexes)

		console.log("charts pre-filter",charts.length);

		charts = charts.filter(c =>{
			var r = true;
			exclusions.forEach(w =>{
				if(c.index.includes(w)){r= false}})
			return r;
		})

		console.log("charts post-filter",charts.length);
		console.log("fetching charts with date: " + strDate);
		//charts = charts.slice(0,100)

		async function wrap(cName,strDate) {
			console.log(cName);
			try {

				var NAfilter = function(cName){
					var r = false;
					dateNAIndexes.forEach(index =>{if(index.includes(cName)){r= true}})
					return r;
				}

				if (NAfilter(cName)) {

					var r = await limiter.schedule(_getChart,cName)
				}else {
					var r = await limiter.schedule(_getChart,cName,strDate)
				}

				//todo: it'd be nice if this included the dang thing I requested
				//could read from next/previous week field (if it's there)
				//console.log(r);
				return r;
			} catch (error) {
				console.error(error);
				return error
				//throw error

			}
		}
		var task = function (chart) {return wrap(chart.index,strDate)}
		var tasks = charts.map(task)
		var results= await Promise.all(tasks);
		//console.log(results);
		var fulfilled = results.filter(r => r.songs)
		var rejected = results.filter(r => !r.songs)

		debugger

		console.log("done!");

	} catch (error) {
		debugger
		console.error(error);
	}
}

main()

// listCharts((err, charts) => {
//
// 	if (err) console.log(err);
// 	debugger
// 	// array of all charts
// 	console.log(charts);
// });

// var strDate = '1970-08-27'
// //var chartName = 'hot-100',
// var chartName = 'rock-streaming-songs'
// getChart(chartName, strDate, (err, chart) => {
// 	if (err) console.log(err);
//
// 	// week of the chart in the date format YYYY-MM-DD
// 	console.log(chart.week);
// 	// URL of the previous week's chart
// 	console.log(chart.previousWeek.url);
// 	// date of the previous week's chart in the date format YYYY-MM-DD
// 	console.log(chart.previousWeek.date);
// 	// URL of the next week's chart
// 	console.log(chart.nextWeek.url);
// 	// date of the next week's chart in the date format YYYY-MM-DD
// 	console.log(chart.nextWeek.date);
// 	// array of top 100 songs for week of August 27, 2016
// 	console.log(chart.songs);
// 	// song with rank: 4 for week of August 27, 2016
// 	console.log(chart.songs[3]);
// 	// title of top song for week of August 27, 2016
// 	console.log(chart.songs[0].title);
// 	// artist of top songs for week of August 27, 2016
// 	console.log(chart.songs[0].artist);
// 	// rank of top song (1) for week of August 27, 2016
// 	console.log(chart.songs[0].rank);
// 	// URL for Billboard cover image of top song for week of August 27, 2016
// 	console.log(chart.songs[0].cover);
// 	// position info of top song
// 	console.log(chart.songs[0].position.positionLastWeek);
// 	console.log(chart.songs[0].position.peakPosition);
// 	console.log(chart.songs[0].position.weeksOnChart);
// });
