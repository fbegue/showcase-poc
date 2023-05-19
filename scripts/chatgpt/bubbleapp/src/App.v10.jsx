import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import networkgraph from "highcharts/modules/networkgraph";
if (typeof Highcharts === "object") {
	networkgraph(Highcharts);
}

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
				keys: ['from', 'to']
			}
		},
		series: [{
			dataLabels: {
				enabled: true,
				format: '{point.name}'
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
			links.push({
				from: artist.artist,
				to: genre
			});
		});
		if (!nodes[artist.artist]) {
			nodes[artist.artist] = { name: artist.artist, id: artist.artist };
		}
	});

	// Add nodes and links to series
	options.series[0].data = Object.values(nodes);
	options.series[0].nodes = Object.values(nodes);
	options.series[0].data = links;

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
			artist: 'Artist C',
			genres: ['country', 'folk', 'blues'],
		},
		{
			artist: 'Artist C',
			genres: ['country', 'folk', 'blues'],
		},
	];

function App(props) {
	return <NetworkGraph artists={artists}/>;
}
export default App;
