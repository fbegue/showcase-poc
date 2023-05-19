import React from 'react';
// import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
more(Highcharts);

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
	// Add more artists and genres as needed
];

const options = {
	chart: {
		type: 'packedbubble',
	},
	title: {
		text: 'Artists and Their Genres',
	},
	plotOptions: {
		packedbubble: {
			minSize: '30%',
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
				filter: {
					property: 'y',
					operator: '>',
					value: 250,
				},
				style: {
					color: 'black',
					textOutline: 'none',
					fontWeight: 'normal',
				},
			},
		},
	},
	series: [
		{
			name: 'Genres1',
			data: data.reduce((result, item) => {
				item.genres.forEach((genre) => {
					const index = result.findIndex((data) => data.name === genre);
					if (index !== -1) {
						result[index].value += 1;
					} else {
						result.push({ name: genre, value: 1 });
					}
				});
				return result;
			}, []),
		},
		{
			name: 'Genres2',
			data: data.reduce((result, item) => {
				item.genres.forEach((genre) => {
					const index = result.findIndex((data) => data.name === genre);
					if (index !== -1) {
						result[index].value += 1;
					} else {
						result.push({ name: genre, value: 1 });
					}
				});
				return result;
			}, []),
		},
	],
};

const BubbleChart = () => (
	<HighchartsReact highcharts={Highcharts} options={options} />
);

export default BubbleChart;
