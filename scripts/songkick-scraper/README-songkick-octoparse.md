# README-songkick-octoparse.md

Attempts at using Octoparse to manually scrape concert listings from Songkick.

## steps to use octoparse output to create playlist

sign into octoparse (g-federated w/ dacandyman0@gmail.com)
run octoparse job, export to json
run octo_preparse.json.js

in songkick_api.js:
replace fetch_metro_events_file with generated json from above

in postman:
hit fetchMetroEvents to fetch genres and populate mongo
- make note of commmittted collection - target collection should have been emptied before insert, but inspect the collection
to make sure everything is kosher
hit resolveEvents, copy returned json to new resolved file

in experimental_api:
set createPlaylistFromJson to use new resolvedArtists file
hit createPlaylistFromJson

