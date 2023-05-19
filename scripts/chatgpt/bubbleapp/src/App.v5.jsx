import React from 'react';
// import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
more(Highcharts);


//import React from 'react';
// import PackedBubbleChart from './PackedBubbleChart';

const artists = [
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
];


const processData = (artists) => {
	const genres = {};

	artists.forEach((artist) => {
		artist.genres.forEach((genre) => {
			if (genre in genres) {
				genres[genre] += 1;
			} else {
				genres[genre] = 1;
			}
		});
	});

	return Object.keys(genres).map((genre) => ({
		name: genre,
		value: genres[genre],
	}));
};


const PackedBubbleChart = ({ artists }) => {
	const data = processData(artists);

	const options = {
		chart: {
			type: 'packedbubble',
			height: '100%',
		},
		title: {
			text: 'Genres by frequency across artists',
		},
		tooltip: {
			useHTML: true,
			pointFormat: '<b>{point.name}:</b> {point.value}',
		},
		plotOptions: {
			packedbubble: {
				minSize: '20%',
				maxSize: '100%',
				zMin: 0,
				zMax: 1000,
				layoutAlgorithm: {
					splitSeries: false,
					gravitationalConstant: 0.02,
				},
				dataLabels: {
					enabled: true,
					format: '{point.name}',
					style: {
						textOutline: false,
					},
				},
			},
		},
		series: [
			{
				name: 'Genres',
				data: data,
			},
		],
	};

	return (
		<div>
			<HighchartsReact highcharts={Highcharts} options={options} />
		</div>
	);
};

//export default PackedBubbleChart;


const App = () => {
	return (
		<div>
			<PackedBubbleChart artists={artists} />
		</div>
	);
};

export default App;
