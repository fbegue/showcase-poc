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

const NetworkGraph = ({ data }) => {
	// define nodes and links arrays to store the data for the graph
	const nodes = [];
	const links = [];

	// iterate through the data array to populate nodes and links
	data.forEach((artist) => {
		// for each artist, iterate through their genres and add them as nodes
		artist.genres.forEach((genre) => {
			// check if the genre node already exists, and if not, add it to the nodes array
			const genreNode = nodes.find((node) => node.id === genre);
			if (!genreNode) {
				nodes.push({
					id: genre,
					size: 1,
					isGenre: true,
				});
			} else {
				genreNode.size += 1;
			}

			// add a link between the artist node and the genre node
			links.push({
				source: artist.artist,
				target: genre,
				value: 1,
			});
		});

		// add the artist node to the nodes array
		nodes.push({
			id: artist.artist,
			size: 0.5,
			isGenre: false,
		});
	});

	// define the options for the chart
	const options = {
		chart: {
			type: 'networkgraph',
			height: '100%',
		},
		title: {
			text: 'Artist Genres Network Graph',
		},
		plotOptions: {
			networkgraph: {
				keys: ['from', 'to'],
				layoutAlgorithm: {
					enableSimulation: true,
					friction: -0.9,
				},
				marker: {
					radius: 10,
				},
				nodes: {
					size: 'size',
					colorByPoint: true,
					states: {
						hover: {
							color: '#ffa31a',
						},
					},
				},
				tooltip: {
					pointFormatter: function () {
						return this.isGenre ? `<b>${this.id}</b>` : this.id;
					},
				},
			},
		},
		series: [
			{
				data: links,
				nodes: nodes,
				type: 'networkgraph',
				name: 'Artist Genres',
			},
		],
	};

	return <HighchartsReact highcharts={Highcharts} options={options} />;
};

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
	return <NetworkGraph data={artists}/>;
}
export default App;
