import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import networkgraph from "highcharts/modules/networkgraph";
if (typeof Highcharts === "object") {
	networkgraph(Highcharts);
}

//src:
//https://www.highcharts.com/docs/chart-and-series-types/network-graph
//https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/network-graph/


// import React from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';

const NetworkGraph = ({ artists }) => {

	const options = {
		chart: {
			type: 'networkgraph',
			height: '100%'
		},
		plotOptions: {
			networkgraph: {
				keys: ['from', 'to'],
				layoutAlgorithm: {
					enableSimulation: true,
					friction: -0.9
				}
			}
		},
		series: [{
			dataLabels: {
				enabled: true,
				format: '{point.name}',
				linkFormat: ''
			},
			data: [],
			nodes: [],
			type: 'networkgraph'
		}]
	};

	const nodes = {};
	const links = [];

	// Map all genres to nodes and artists to links
	artists.forEach((artist) => {
		artist.genres.forEach((genre) => {
			if (!nodes[genre]) {
				nodes[genre] = { name: genre, id: genre };
			}
			//record links

			links.push({
				from: artist.artist,
				to: genre
			});
		});
		if (!nodes[artist.artist]) {
			nodes[artist.artist] = { name: artist.artist, id: artist.artist };
		}
	});

	let nodeSizeMap = {};
	links.forEach(fromToOb =>{
		if(!nodeSizeMap[fromToOb.to]){nodeSizeMap[fromToOb.to] = 1}
		else{nodeSizeMap[fromToOb.to]++}
	})

	let nodeValues =  Object.values(nodes);
	nodeValues.forEach(tuple =>{
		if(nodeSizeMap[tuple.id]){
			tuple.marker ={radius: nodeSizeMap[tuple.id]*5}
		}
		else{
			tuple.marker ={radius: 4}
		}

	})
	 //debugger
	// Add nodes and links to series
	options.series[0].data = Object.values(nodes);
	options.series[0].nodes = Object.values(nodes);
	options.series[0].data = links;
	//debugger

	return (
		<div>
			<HighchartsReact highcharts={Highcharts} options={options} />
		</div>
	);
}


let artists =
	[  {
		artist: 'Artist A',
		genres: ['rock', 'pop', 'jazz'],
	},
		{
			artist: 'Artist B',
			genres: ['pop', 'hip hop', 'electronic'],
		},
		{
			artist: 'Artist C',
			genres: ['country', 'folk', 'blues'],
		},
		{
			artist: 'Artist D',
			genres: ['country', 'folk', 'blues'],
		},
		{
			artist: 'Artist E',
			genres: ['country', 'jazz', 'blues'],
		},
		{
			artist: 'Artist F',
			genres: ['hip hop', 'electronic', 'blues'],
		},
	];

function App(props) {
	return <NetworkGraph artists={artists}/>;
}
export default App;
