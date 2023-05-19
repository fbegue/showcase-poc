import React from 'react';
import { LinearScale, Chart,PointElement } from "chart.js";
import { Bubble } from 'react-chartjs-2';
Chart.register(LinearScale);
Chart.register(PointElement);

const data = {
	datasets: [
		{
			label: 'Artist Genres',
			data: [
				{ x: 10, y: 20, r: 30 },
				{ x: 30, y: 10, r: 20 },
				{ x: 40, y: 60, r: 25 },
				{ x: 60, y: 30, r: 10 },
				// add more data points here as needed
			],
			backgroundColor: ['red', 'blue', 'green', 'yellow'],
		},
	],
};

const options = {
	scales: {
		x: {
			min: 0,
			max: 100,
		},
		y: {
			min: 0,
			max: 100,
		},
	},
};

const BubbleChart = () => {
	return (
		<Bubble data={data} options={options} />
	);
};

export default BubbleChart;
