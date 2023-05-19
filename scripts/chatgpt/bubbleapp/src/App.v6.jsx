import React from 'react';
// import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
more(Highcharts);

//
// import React from 'react';
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
	}

];

const getSeriesData = () => {


	//note: fixed

	//const genres = {};
	// data.forEach(({ artist, genres }) => {
	// 	genres.forEach(genre => {
	// 		if (genres.hasOwnProperty(genre)) {
	// 			genres[genre].push(artist);
	// 		} else {
	// 			genres[genre] = [artist];
	// 		}
	// 	});
	// });

	const genresMap = {};
	data.forEach(({ artist, genres }) => {
		genres.forEach(genre => {
			console.log(genre)
			if (genresMap[genre]) {
				genresMap[genre].push(artist);
			} else {
				genresMap[genre] = [artist];
			}
		});
	});



	console.log("genres",genresMap)
	//let out = Object.entries(genres).map(([genre, artists
	let out = Object.entries(genresMap).map(([genre, artists]) => {
		return {
			name: genre,
			data: artists.map(artist => ({ name: artist, value: 1 })),
		};
	});
	console.log("out",out)
	return out;
};

const options = {
	chart: {
		type: 'packedbubble',
		height: '100%',
	},
	title: {
		text: 'Artist Genres',
	},
	tooltip: {
		useHTML: true,
		pointFormat: '<b>{point.name}:</b> {point.value}',
	},
	plotOptions: {
		packedbubble: {
			minSize: '30%',
			maxSize: '120%',
			zMin: 0,
			zMax: 1000,
			layoutAlgorithm: {
				gravitationalConstant: 0.05,
				splitSeries: true,
				seriesInteraction: false,
				dragBetweenSeries: true,
				parentNodeLimit: true,
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
	series: getSeriesData(),
};

const PackedBubbleChart = () => {
	return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default PackedBubbleChart;

