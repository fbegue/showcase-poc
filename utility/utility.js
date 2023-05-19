var me = module.exports;
me.giveMePayloads = function(items,limit,field){

	var payload = [];
	var payloads = [];

	if(items.length < limit){
		return [items]

	}

	items.forEach((t,i) =>{
		var current = t;
		if(field){current = t[field]}

		if(i === 0){payload.push(current)}
		else{
			if(!(i % limit === 0)){	payload.push(current)}
			else{payloads.push(payload);

				payload = [];payload.push(current)}
		}
	})
	if(payload.length > 0){payloads.push(payload)}
	//console.log("items",items.length);
	//console.log("payloads",payloads);
	//var count = 0; payloads.forEach(p =>{count = count + p.length})
	//console.log("count",count);
	return payloads


}
