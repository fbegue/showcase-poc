import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import networkgraph from "highcharts/modules/networkgraph";
if (typeof Highcharts === "object") {
	networkgraph(Highcharts);
}

const NetworkGraph = ({ data }) => {
	const options = {
		chart: {
			type: 'networkgraph',
			height: '100%',
		},
		title: {
			text: 'Artists and Their Genres',
		},
		series: [
			{
				data_old: data.map(({ artist, genres }) => ({
					name: artist,
					genres: genres,
				})),
				nodes: data.map(({ artist }, i) => ({
					id: i,
					name: artist,
					marker: {
						radius: 10,
					},
				})),
				data: [
					['Artist A', 'Artist B'],
					['account', 'for'],
					['add', 'up'],
					],
				marker: {
					radius: 10,
				},
				type: 'networkgraph',
				layoutAlgorithm: {
					enableSimulation: true,
				},
				keys: ['from', 'to'],
				dataLabels: {
					enabled: true,
					linkFormat: '{point.to}',
				},
				events: {
					click: function (event) {
						console.log(event.point);
					},
				},
			},
		],
	};

	return <HighchartsReact highcharts={Highcharts} options={options} />;
};

//export default NetworkGraph;

// import React from 'react';
// import NetworkGraph from './NetworkGraph';

const App = () => {
	const data = [
		{
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
			genres: ['country', 'folk', 'blues'],
		},
	];

	return (
		<div className="App">
			<NetworkGraph data={data} />
		</div>
	);
};

export default App;

