let fs = require('fs')
var fif = require("./stones_greatest_guitarists.p1.json");
var hun = require("./stones_greatest_guitarists.p2.json")
let artistsRaw = [].concat(fif).concat(hun)

let solveReg = function(str){
	const regex = /Key Tracks: (.*)/gm;

// Alternative syntax using RegExp constructor
// const regex = new RegExp('Key Tracks: (.*)', 'gm')

	let m;
	while ((m = regex.exec(str)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === regex.lastIndex) {
			regex.lastIndex++;
		}
		// The result can be accessed through the `m`-variable.
		m.forEach((match, groupIndex) => {
			//console.log(`Found match, group ${groupIndex}: ${match}`);
		});
		if(m && m[1]){
			return m[1]
		}
		else{
			debugger
		}
	}



}

//testing:
//artistsRaw = artistsRaw.slice(0,5)
let parsed = []
artistsRaw.forEach(aob =>{

	let red = {artist:{name:aob.Title},key_tracks_string:aob.Description4,reg_solve:null}
	let solve =solveReg( aob.Description4);
	if(!solve){
		console.warn("solveReg failure. input desc:",aob.Description4)
	}else{
		//let ex = '"Rhiannon," "Go Your Own Way"';
		//var mystring = '"this one" and "that one"';
		var solvearr = solve.match(/"(.*?)"/g);

		if(!solvearr){
			console.warn("solvearr failure. input solve:",solve)
		}
		else{
			solvearr = solvearr.map(function(n){ return n.replace(/"/g,'')})
			if(solvearr){
				let mysubs = []
				solvearr.forEach(s =>{mysubs.push(s.replace(',', ''));})
				red.reg_solve=mysubs;
			}else{
				console.warn("solvearr failure. input solve:",solve)
				//debugger
			}
			red.track_obs = red.reg_solve.map(s =>{return {name:s,type:"track"}})
			console.log({red})
			parsed.push(red);
		}
	}
})



fs.writeFile("./guitaristTrackTuples.json", JSON.stringify(parsed), err => {
	if (err) console.log("Error writing file:", err);
});

