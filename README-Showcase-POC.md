# Showcase-POC

# TODOS
- keep an eye out for outdated calls to pageIt (should come from network_utility)
- trying to break out clean, documented code from `apis/spotify_api.js` into separate files in `spotify_api` directory
- adding "stubs" where necessary to enable local calls (see: playlist_api.js @ getUserPlaylists)
    - app.js no longer registers routes prefixed with "_"
- test/create test runner for other endpoints to verify `utility/network_utility.js` function moves went smoothly
- adjust startup script to just warn if can't connect to sql
    - this is part of a larger push to just set this to the side for now

 
# contents by directory

## apis


`spotify_api.js` | current store for all spotify api related 
- also handles token management, including choosing static refresh-token to avoid having to auth every time 
`spotify_api/base.js` | beginning of reorging spotify features
`spotify_api/playlist_api.js` | spotify playlist related

`db_api.js` | manages SQL tables

`db_mongo_api.js` | manages mongo tables

`songkick_api.js` | songkick (events) related

`wikipedia_api.js` | experimental wikipedia functions

`experimental_api.js` | utilized by many `scripts` but also has some custom functions:

-


## scripts

billboard-top-100-scraper
chatgpt
experience-columbus-scraper
ripYoutubePlaylist
rolling-stones-top-100-guitarists-scraper
rolling-stones-top-500-albums-scraper
songkick-scraper

# setup

DB seeding
- http://localhost:8888/api/insertStatic

refresh events catalog in mongo (always empties the DB before inserting)
- http://localhost:8888/fetchMetroEvents

Config
- switch sql instance by changing config passed to `poolPromise` in `db.js`
- switch mongo instance by changing uri in `apis/db_mongo_api.js`

# startup / execution

use webstorm config for `app.js`

use postman to hit endpoints

# deployment

## commit steps (lambda)

`npm run commit 'example message'`
`git push`

## deploy steps (lambda)

//deploy a (the) function
`npm run deploy`

//invoke a function
`serverless invoke local --function app --path testing/test.json`

//restart lambda instance w/out redeploying (there is no actual method for this)
- go to lambda > configuration > and tick allocated memory up/down 1 mb

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/showcase-backend-app-dev-app?tab=configure
https://stackoverflow.com/questions/50866472/restarting-aws-lambda-function-to-clear-cache

# known bugs

- if you get something like:  `EMFILE: too many open files` when deploying, your machine literally has too many files open. close some and it'll work again

