import React from 'react';
import { Bubble } from 'react-chartjs-2';

const data = {
	datasets: [
		{
			label: 'Artists by Genre',
			data: [
				{ x: 10, y: 20, r: 5 },
				{ x: 15, y: 10, r: 10 },
				{ x: 5, y: 25, r: 15 },
				{ x: 20, y: 5, r: 20 },
				{ x: 25, y: 15, r: 25 },
			],
		},
	],
};

const options = {
	title: {
		display: true,
		text: 'Artists by Genre',
	},
	scales: {
		xAxes: [
			{
				ticks: {
					min: 0,
					max: 30,
					stepSize: 5,
				},
				scaleLabel: {
					display: true,
					labelString: 'Number of Artists',
				},
			},
		],
		yAxes: [
			{
				ticks: {
					min: 0,
					max: 30,
					stepSize: 5,
				},
				scaleLabel: {
					display: true,
					labelString: 'Genre',
				},
			},
		],
	},
	tooltips: {
		callbacks: {
			label: (tooltipItem, data) => {
				const label = data.datasets[tooltipItem.datasetIndex].label || '';
				const genre = tooltipItem.yLabel;
				const count = tooltipItem.xLabel;
				return `${label}: ${genre} (${count} artists)`;
			},
		},
	},
};

const BubbleChart = () => {
	const chart = 	const <div></div>

	return (
);
};

export default BubbleChart;

