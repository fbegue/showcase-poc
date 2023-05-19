import React from 'react';
// import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
more(Highcharts);


// /import React from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';

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

const PackedBubbleChart = () => {
	const options = {
		chart: {
			type: 'packedbubble',
			height: '100%'
		},
		title: {
			text: 'Artists by Genre'
		},
		legend: {
			enabled: false
		},
		series: data.reduce((result, artist) => {
			artist.genres.forEach(genre => {
				const seriesIndex = result.findIndex(series => series.name === genre);
				if (seriesIndex >= 0) {
					result[seriesIndex].data.push({
						name: artist.artist,
						value: 1
					});
				} else {
					result.push({
						name: genre,
						data: [{
							name: artist.artist,
							value: 1
						}]
					});
				}
			});
			return result;
		}, [])
	};

	return (
		<HighchartsReact highcharts={Highcharts} options={options} />
	);
};

export default PackedBubbleChart;
