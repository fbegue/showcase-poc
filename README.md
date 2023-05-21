Showcase-POC

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

# deploy steps (lambda)

//deploy a (the) function
`npm run deploy`

//invoke a function
`serverless invoke local --function app --path testing/test.json`

//restart lambda instance w/out redeploying (there is no actual method for this)
- go to lambda > configuration > and tick allocated memory up/down 1 mb

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/showcase-backend-app-dev-app?tab=configure
https://stackoverflow.com/questions/50866472/restarting-aws-lambda-function-to-clear-cache

# development info 


## change notes

- 05-21-23
    - moved all network utility to `utility/network_utility.js`
        - as a result, refactored and tested the most complicated endpoints `resolvePlaylists()`
    - added dupe prevention and light parameterization to `experimental_api.archiveLikedSongs()` 


## todos

 -test/create test runner for other endpoints to verify `utility/network_utility.js` function moves went smoothly


