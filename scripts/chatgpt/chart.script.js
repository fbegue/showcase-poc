// Define the data for the chart
const Chart = require("chart.js")
debugger

const data = {
	labels: ['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Country'],
	datasets: [{
		label: 'Genres by Artist',
		data: [
			{x: 3, y: 5, r: 15}, // {x: number of artists, y: number of songs, r: size of bubble}
			{x: 2, y: 7, r: 20},
			{x: 6, y: 3, r: 10},
			{x: 4, y: 2, r: 5},
			{x: 1, y: 4, r: 25},
		],
		backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
	}]
};

// Configure the chart options
const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'top',
		},
		tooltip: {
			callbacks: {
				label: function(context) {
					const data = context.dataset.data[context.dataIndex];
					return `Artists: ${data.x}, Songs: ${data.y}`;
				}
			}
		}
	},
	scales: {
		x: {
			title: {
				display: true,
				text: 'Number of Artists'
			},
			ticks: {
				beginAtZero: true
			}
		},
		y: {
			title: {
				display: true,
				text: 'Number of Songs'
			},
			ticks: {
				beginAtZero: true
			}
		}
	}
};

// Get the canvas element and create the chart
const canvas = document.getElementById('bubble-chart');
const ctx = canvas.getContext('2d');
const myChart = new Chart(ctx, {
	type: 'bubble',
	data: data,
	options: options
});
