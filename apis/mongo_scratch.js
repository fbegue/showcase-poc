const { MongoClient } = require('mongodb');

const uriRemote = "mongodb+srv://cluster0.th2x5.mongodb.net/soundfound?authSource=$external&authMechanism=MONGODB-AWS&retryWrites=true&w=majority"
const uriLocalCluster = "mongodb+srv://admin:hlUgpnRyiBzZHgkd@cluster0.th2x5.mongodb.net/"
//note: deprecated Robo3T db
const uriLocalDB = "mongodb://localhost:27017"

let uri = null;
if(process.env.AWS_SESSION_TOKEN === undefined){
	console.log("connecting to local mongo atlas instance");
	uri = uriLocalCluster
	//testing:
	//uri = uriLocalDB;
}
else{
	console.log("connecting to remote mongo atlas instance");
	uri = uriRemote
}


let clientAtlas = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//find and delete some

var test =  function(){
	return new Promise(function(done, fail) {
		clientAtlas.connect()
			.then(ignored =>
				{
					var dbo = clientAtlas.db("soundfound");
					// var query = {id:null}
					 var query = {id:{$exists:false}}
					//var query = {id:{$exists:true}}
					dbo.collection('users').find(query).toArray()
						.then(r =>{
						debugger
						dbo.collection('users').deleteMany(query).then(r =>{

						})
					})
				}
				,e =>{console.error(e);fail(e)})
	})
}

test()
.then(r =>{

	debugger
},e=>{})
