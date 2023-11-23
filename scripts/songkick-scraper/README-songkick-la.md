# README-songkick-la.md

src: https://www.songkick.com/metro-areas/17835-us-los-angeles-la?utf8=%E2%9C%93&filters%5BminDate%5D=11%2F14%2F2022&filters%5BmaxDate%5D=11%2F14%2F2022

## steps

run octoparse job, export to csv
run octo_preparse.csv.js with new csv
replace fetch_metro_events_file with generated json from above

hit fetchMetroEvents
hit resolveEvents, copy returned json to new resolvedArtists file
set createLAEventsToArtistsPlaylist to use new resolvedArtists file
hit createLAEventsToArtistsPlaylist

