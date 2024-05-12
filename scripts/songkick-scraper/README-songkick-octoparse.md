# README-songkick-octoparse.md

Attempts at using Octoparse to manually scrape concert listings from Songkick.

## steps to use octoparse output to create playlist

sign into octoparse (g-federated w/ dacandyman0@gmail.com)
run octoparse job
- don't neglect to pray that this bs actually still works!
remove duplicates if prompted
- TODO: spot checking has "confirmed" that these duplicates are just empty lines the scraper confuses with concert 
entries, but scraper should be modified to skip these lines / mark them as what they are to be removed as dupe later
check that output lines = website's "Currently there are <NUMBER> upcoming concerts..."
export to json
- example input: `songkick-columbus.20240310.json`
- example output: `songkick-columbus.20240310.output.json`
run octo_preparse.json.js

in songkick_api.js:
replace static defined "inputJsonFile" target with path to generated json from above

in postman:
hit fetchMetroEvents to fetch genres and populate mongo
- note: entire body is ignored since we're
- note: when finished, inspect target collection to make sure everything is kosher
hit resolveEvents, copy returned json to new resolved file
- example output: `songkick-columbus.20240310.output.resolved.json`

in experimental_api:
set createPlaylistFromJson to use new resolvedArtists file
hit createPlaylistFromJson

