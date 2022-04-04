###lambda

//before deploying:
- change sql instance
- (mongo can take care of itself, unless I was using old Robo3T copy)

//deploy a (the) function
`npm run deploy`

//invoke a function
`serverless invoke local --function app --path testing/test.json`

//restart lambda instance w/out redeploying (there is no actual method for this)
- go to lambda > configuration > and tick allocated memory up/down 1 mb

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/showcase-backend-app-dev-app?tab=configure
https://stackoverflow.com/questions/50866472/restarting-aws-lambda-function-to-clear-cache

### Showcase-POC

DB seeding
- http://localhost:8888/api/insertStatic

Events fetch (always empties the DB before inserting)
- http://localhost:8888/fetchMetroEvents

Config
- switch sql instance by changing config passed to `poolPromise` in `db.js`
- switch mongo instance by changing uri in `apis/db_mongo_api.js`



