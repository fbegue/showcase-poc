const sql = require('mssql')
var os = require("os");

//todo: pulling db_api in at any point = `db.getPoolRDS is not a function` anywhere it'
//const db_api = require('./apis/db_api')
//const config = {/*...*/}

var IM = require('./utility/inMemory')

const config_local = {
	server: 'localhost\\SQLEXPRESS',     // Server name
	database: 'master',      // Database name
	user: 'sa',                // SQL Server username
	password: 'sa',            // SQL Server password
	driver: 'mssql',                      // Use the appropriate driver
	options: {
		encrypt: false,                   // Use this if not using encryption
		trustServerCertificate: true      // Trust self-signed certificates
	}
};

var config_rds = {
	"user": 'admin',
	"password": 'Cy4NuJPvLGF8',
	"server": 'soundfound-db.crqf6gmeo1va.us-east-1.rds.amazonaws.com',
	// "database": 'soundfound',
	"database": 'SampleDatabase',
	"port": 1433,
	"dialect": "mssql",
	// "requestTimeout":16000,
	"requestTimeout":32000,
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

var config_remote = {
	"user": 'test',
	"password": 'test',
	"server": '192.168.68.103:1433',
	"database": 'master',
	"port": '61427',
	"dialect": "mssql",
	options: {
		trustServerCertificate: true // change to true for local dev / self-signed certs
	}
};

var config;
 var config_override = false;
//var config_override = config_rds;
console.log("os.hostname: ",os.hostname())
if(config_override){
	console.log("override: connecting to remote rds sql instance")
	config=config_rds
}
else if(os.hostname() === "DESKTOP-43TRT7N"){
	config=config_local
	console.log("connecting to sql server:" + config_local.server);
}else{
	config=config_rds
	console.log("connecting to sql server" + config_rds.server);
}

var poolRDS = {}
const poolPromise = new sql.ConnectionPool(config)
	.connect()
	.then(pool => {
		console.log('Connected to MSSQL')
		IM.setGenresQualifiedMap(pool).then(msg =>{
			console.log(msg);
			return pool
		})
		poolRDS = pool;
		return pool
	})
	.catch(err => console.log('SQL Database Connection Failed! Bad Config: ', err))

var getPoolRDS = function(){
	return poolRDS
}

module.exports = {
	sql, poolPromise,poolRDS,getPoolRDS
	//clientAtlas,getClientAtlas,clientAtlasProm,getConnectClientAtlas
}
//module.exports.connect = client.connect()
	//.then(r =>{"client.connect() complete"},e =>{console.error("mongo client.connect() error",e);})
