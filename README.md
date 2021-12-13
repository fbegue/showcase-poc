###lambda
//resources: 
https://master.d267e964bph18g.amplifyapp.com/dashboard

//deploy a (the) function
sls deploy function -f app

//invoke a function
serverless invoke local --function app --path testing/test.json

//restart lambda instance w/out redeploying (there is no actual method for this)
- go to lambda > configuration > and tick allocated memory up/down 1 mb

https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/showcase-backend-app-dev-app?tab=configure
https://stackoverflow.com/questions/50866472/restarting-aws-lambda-function-to-clear-cache

### Showcase-POC

- DB seeding @ http://localhost:8888/api/insertStatic


