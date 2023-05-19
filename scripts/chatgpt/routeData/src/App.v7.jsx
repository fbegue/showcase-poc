import React from "react";
import Highcharts from "highcharts";
import networkgraph from "highcharts/modules/networkgraph";
import HighchartsReact from "highcharts-react-official";

if (typeof Highcharts === "object") {
	networkgraph(Highcharts);
}
// import React from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';

const Graph = () => {

	var data = [
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


	const genres = {};
	const nodes = [];
	const links = [];

	// Iterate through the data and group artists by genre
	data.forEach((artist) => {
		artist.genres.forEach((genre) => {
			if (!genres[genre]) {
				genres[genre] = { name: genre, artists: [] };
				nodes.push(genres[genre]);
			}

			genres[genre].artists.push(artist);
		});
	});

	debugger
	// Create links between genres and artists
	Object.keys(genres).forEach((genre) => {
		genres[genre].artists.forEach((artist) => {
			links.push({
				source: genre,
				target: artist.artist,
			});
		});
	});

	debugger
	// Create the Highcharts options object
	const options = {
		chart: {
			type: 'networkgraph',
			height: '100%',
		},
		title: {
			text: 'Artists and Genres',
		},
		plotOptions: {
			networkgraph: {
				layoutAlgorithm: {
					enableSimulation: true,
					friction: -0.9,
				},
			},
		},
		series: [
			{
				dataLabels: {
					enabled: true,
				},
				data: nodes,
				nodes: nodes,
				links: links,
			},
		],
	};

	return (
		<HighchartsReact
			highcharts={Highcharts}
			options={options}
		/>
	);
};

export default Graph;
