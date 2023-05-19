//prompt:
//write javascript code to scrape this website "https://www.rollingstone.com/music/music-lists/100-greatest-guitarists-153675/richard-thompson-47675" and produce a JSON with 50 rows with guitarist name and the key tracks listed for them on this page

const cheerio = require('cheerio');
const axios = require('axios');

// Send an HTTP GET request to the website
axios.get('https://www.rollingstone.com/music/music-lists/100-greatest-guitarists-153675/')
	.then(response => {
		const $ = cheerio.load(response.data);
		const guitarists = [];

		// Find the list of guitarists on the page
		$('ol.list-style-none').find('li').each((i, elem) => {
			if (i < 50) { // limit to 50 rows
				const $elem = $(elem);
				const name = $elem.find('h3.title').text().trim();
				const tracks = $elem.find('p.subhed').text().trim().split(', ');
				guitarists.push({ name, tracks });
			}
		});

		// Print the JSON output
		console.log(JSON.stringify(guitarists, null, 2));
	})
	.catch(error => console.log(error));
