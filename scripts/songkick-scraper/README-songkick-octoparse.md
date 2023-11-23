# README-songkick-octoparse.md

Attempts at using Octoparse to manually scrape concert listings from Songkick.

## steps to use octoparse output to create playlist

run octoparse job, export to json
run octo_preparse.json.js

in songkick_api.js:
replace fetch_metro_events_file with generated json from above

in mongo:
clean the 

in postman:
hit fetchMetroEvents to fetch genres and populate mongo
hit resolveEvents, copy returned json to new resolved file

in spotify_api.js:
set createLAEventsToArtistsPlaylist to use new resolvedArtists file
hit createLAEventsToArtistsPlaylist

