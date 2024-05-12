var me = module.exports;

me.state_metros_map = {"OH":[
		{"displayName":"Columbus", "id":43201},
		{"displayName":"Columbus", "id":9480},
		{"displayName":"Cleveland", "id":14700},
		{"displayName":"Cincinnati", "id":22040},
		// {"displayName":"Dayton", "id":3673},
		{"displayName":"Toledo", "id":5649},
	],"CA":[
		{"displayName":"Los Angeles", "id":90305}
	]};

//note: either at some point they changed venue.metroArea.id to zipcodes instead of their own ids,
//or I'm just conflating scraped data with the id I used to get
me.url_city_name_metroArea_id_map = {"Columbus":[
	"43201",
	"43202",
	"43212",
	"43229",
	"43215",
	"43228",
	"43055",
	"44611",
	"43210",
	"43081",
	"43017",
	"43211",
	"43232",
	"43207",
	"43113",
	"43214",
	"43220",
	"45601",
	"45701",
	"43080"
]}




