# README-songkick-octoparse.md

Attempts at using Octoparse to manually scrape concert listings from Songkick.

## steps to use octoparse output to create playlist

sign into octoparse (g-federated w/ dacandyman0@gmail.com)
run octoparse job
- change "Go to Webpage" action URL to target metro (can also check my tracked "Locations" on SK website)
  - https://www.songkick.com/metro-areas/9480-us-columbus
  - https://www.songkick.com/metro-areas/14700-us-cleveland
  - https://www.songkick.com/metro-areas/90736-us-santa-fe
  - https://www.songkick.com/metro-areas/21024-us-albuquerque
  - https://www.songkick.com/metro-areas/13560-us-salt-lake-city
- don't neglect to pray that this bs actually still works!
remove duplicates if prompted
- TODO: spot checking has "confirmed" that these duplicates are just empty lines the scraper confuses with concert 
entries, but scraper should be modified to skip these lines / mark them as what they are to be removed as dupe later
check that output lines = website's "Currently there are <NUMBER> upcoming concerts..."
export to json to: `C:\Users\Candy\WebstormProjects\Showcase-POC\scripts\songkick-scraper\octoparse-results`
- example export filename:
  - `songkick-columbus.20240721.json`
  - `songkick-cleveland.20240923.json`
- run octo_preparse.json.js (replace filename at top, autogenerates output filename)
  - example octo_preparse output filename: `songkick-columbus.20240721.output.json`

in songkick_api.js:
replace static defined "inputJsonFile" target with path to generated json from above

in postman:
hit fetchMetroEvents to fetch genres and populate mongo
- note: entire body is ignored since we're faking it
- note: when finished, inspect logs and target collection to make sure everything is kosher
hit resolveEvents, making sure metro.displayName is that of the collection we just wrote to
- MANUALLY copy returned json to new resolved file
- example output: `songkick-columbus.20240721.output.resolved.json`

in experimental_api:
- set createPlaylistFromJson to use new resolvedArtists file
- set new playlistName
  - modify date if date start filter is used in step below
    - songkick-columbus.20240721.<START_DATE>
- hit createPlaylistFromJson in Postman
    - this WILL process dateFilter, however if events were just fetched than start will be limited by today's date anyways

