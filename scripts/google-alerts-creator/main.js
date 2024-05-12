
var keywords = [
	//"Nathaniel Rateliff & The Night Sweats",
	// "BJ The Chicago Kid",
	// "Red Hot Chili Peppers",
	// "Remi Wolf",
	// "Black Pistol Fire",
	// "White Denim",
	// "Cbdb",
	// "Sugadaisy",
	// "The Strokes",
	// "Kid Cudi",
	// "Muse",
	// "Alabama Shakes",
	// "Death From Above 1979",
	// "Bassnectar",
	// "LAKE",
	"Break Science",
	"Stoop Kids",
	"The Weeknd",
	"The Derek Trucks Band",
	"De La Soul",
	"Billy Strings",
	"Chance the Rapper",
	"Delicate Steve",
	"Queen",
	"Lettuce",
	"Blended Babies",
	"Magic City Hippies",
	"GRiZ",
	"Cage The Elephant",
	"Flying Lotus",
	"Kendrick Lamar",
	"Tedeschi Trucks Band",
	"Frank Ocean",
	"Father John Misty",
	"The Dip",
	"TOOL",
	"Gorillaz",
	"Quinn XCII",
	"Diane Coffee",
	"Anderson .Paak",
	"GROUPLOVE",
	"Leon Bridges",
	"Beck",
	"My Morning Jacket",
	"The Dead Weather",
	"Bahamas",
	"Moon Hooch",
	"St. Paul & The Broken Bones",
	"Still Woozy",
	"Portugal. The Man",
	"Queens of the Stone Age",
	"Galactic",
	"Daft Punk",
	"Electric Six",
	"Glass Animals",
	"Lil Wayne",
	"Ty Segall",
	"EARTHGANG",
	"The Floozies",
	"Lukas Nelson and Promise of the Real",
	"The Revivalists",
	"M83",
	"Primus",
	"Dua Lipa",
	"Cold War Kids",
	"Dan Auerbach",
	"Black Joe Lewis & The Honeybears",
	"J. Cole",
	"Alicia Witt",
	"Dopapod",
	"Action Bronson",
	"Snarky Puppy",
	"Arctic Monkeys",
	"Blockhead",
	"Eminem",
	"The Black Keys",
	"The Bright Light Social Hour",
	"Fly Golden Eagle",
	"Electric Guest"
]

function addAlert(i) {
	// Retrieve the keyword to work with
	const keyword = encodeURIComponent(keywords[i] + " tour")
	var left = "params=hexcode%22"
	var right = "%22hexcode"
	var params = left + keyword + right
	// Stop the script if there's no keyword
	if (!keywords[i] || !keyword) { return; }

	console.log(`Adding ${keyword}`)

	// 1. Replace the line below with your own fetch (see Copy as fetch above)
	// 2. Replace `dev.to` with `${keyword}`
	fetch("https://www.google.com/alerts/create?x=AMJHsmUaw929hw1qnurcFWCNmbWidfXA6g%3A1713742955596", {
		"headers": {
			"accept": "*/*",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "application/x-www-form-urlencoded;charset=UTF-8",
			"sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
			"sec-ch-ua-arch": "\"x86\"",
			"sec-ch-ua-bitness": "\"64\"",
			"sec-ch-ua-full-version": "\"123.0.6312.124\"",
			"sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"123.0.6312.124\", \"Not:A-Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"123.0.6312.124\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-model": "\"\"",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-ch-ua-platform-version": "\"10.0.0\"",
			"sec-ch-ua-wow64": "?0",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"x-client-data": "CIy2yQEIprbJAQipncoBCI6XywEIlqHLAQiFoM0BCN7szQEIiovOAQiG1cwiGPbJzQEY1d3NARiY9c0BGJ34zQEY2IbOARioh84BGOuNpRc=",
			"cookie": "HSID=A2HFhQbiqCCj7fEKo; SSID=Ad4dtBoBuKKXuWNY0; APISID=hHT9bFyA2tOhZGCM/Aor41HU4TiT138zfc; SAPISID=mToyKGnRNdvKZunX/AecryKOuKPxk2wj5l; __Secure-1PAPISID=mToyKGnRNdvKZunX/AecryKOuKPxk2wj5l; __Secure-3PAPISID=mToyKGnRNdvKZunX/AecryKOuKPxk2wj5l; SEARCH_SAMESITE=CgQI2poB; OGPC=19031986-1:; S=billing-ui-v3=iPpPLTB5rFr8ddn9OhuM0YYl3Fj6mUGm:billing-ui-v3-efe=iPpPLTB5rFr8ddn9OhuM0YYl3Fj6mUGm; SID=g.a000iwiCbqatSATjTPUhxf5k5gt53E3WbKEmV90ZbHq6KuPWsgsi50pC17UqULw_xUB5ulBh4wACgYKARYSAQASFQHGX2MivX5rdopoKIQ0RBuFQkp5nRoVAUF8yKqNZMswCuaZIOKl2Xe_MTJn0076; __Secure-1PSID=g.a000iwiCbqatSATjTPUhxf5k5gt53E3WbKEmV90ZbHq6KuPWsgsicR77zqo-QdomIcsUAqotnwACgYKASoSAQASFQHGX2Mi7Z3Ww7eEodYpehrQg35uwBoVAUF8yKoMx8FsmN-J3D9rD0Ph5MT60076; __Secure-3PSID=g.a000iwiCbqatSATjTPUhxf5k5gt53E3WbKEmV90ZbHq6KuPWsgsi7ctoz0opkarWyE1x9uH_XAACgYKAfUSAQASFQHGX2MinC5QtUR4AQHgX5iVw5quexoVAUF8yKoM_Ze7onpMaguwMZ2mq80H0076; 1P_JAR=2024-04-21-23; AEC=AQTF6Hxp7401Nn4l0wuKBvNdjvs4QcShDylecKtvjpf5bsfEYjV7ZSj0kA; __Secure-1PSIDTS=sidts-CjEB7F1E_Ja5uBBYCLsoF1wcPItl6oDrU5RYSdR_8odAT0SfK4ZusBeTa3bp-jfgfahnEAA; __Secure-3PSIDTS=sidts-CjEB7F1E_Ja5uBBYCLsoF1wcPItl6oDrU5RYSdR_8odAT0SfK4ZusBeTa3bp-jfgfahnEAA; NID=513=mWqTLR3AgqMq16ThqDD8lCiVjkTgAFJr4Qjb8FMPUjgOwFff8vI76k3KzpcYfhvEPzlCmvTSftsqWnlElO3UWkrvpQRNvaL3iFPqvFOR3Q3r7X9dKaGFsFxMwG9_92Li3xhpybSgxRGsoA7VEB3ZQ80ehtYV5GVcUUG1wto_z-yye67ibIeDuGVWAOHWB0wRutqCUWP6b2PbKZmYfZGdv4X2UZyeXrdNZORGuN92GQheS0hziUzqyo6umY7jdNFXKwTRtSESDlmJQY2RuspV5LXP0EFvPzVkjZk6bdXC5ROyhLYWbm9dBGa5ojMuFjn87Em0oYDpjwAHPEi9wczTHdt1j7PISbaucnsz1aM2n46dXE0; DV=g4_rLM_CiHdRMKf_7kRMOXkjWmww8NjkTapnFuvyeQIAAFDiK0RSxy0fuAAAAEiTLS4ARmiUMAAAAAwjI3J9dr-QDAAAAA; UULE=a+cm9sZTogMQpwcm9kdWNlcjogMTIKdGltZXN0YW1wOiAxNzEzNzQyODAxOTEyMDAwCmxhdGxuZyB7CiAgbGF0aXR1ZGVfZTc6IDM5OTkwMDY3MgogIGxvbmdpdHVkZV9lNzogLTgzMDQ3MjE5Mgp9CnJhZGl1czogNTY5MTk0LjE2MjgyMDM5OTMKcHJvdmVuYW5jZTogNgo=; SIDCC=AKEyXzVMnR_Ix347c52MsLgQVEXKaH8hIBEvoZTZi4NfbveazlWQO4rt4Rilgv-gAdqCGhlRDVQ; __Secure-1PSIDCC=AKEyXzU3s_9WE5qsj69rirD_rZ4jdOJq1ynSI7WsVh4aHIkKe7PY70agJv4MbzpCER1djfgi1LU; __Secure-3PSIDCC=AKEyXzXzdTfjFbPzBnpCfY2KrMTri-dTmjsaPH6h94PyWy8e7ybBWdABw4eiLGnb-4tmpKcs1CZ5",
			"Referer": "https://www.google.com/alerts",
			"Referrer-Policy": "strict-origin-when-cross-origin"
		},
		"body": `params=%5Bnull%2C%5Bnull%2Cnull%2Cnull%2C%5Bnull%2C%22${keyword}%22%2C%22com%22%2C%5Bnull%2C%22en%22%2C%22US%22%5D%2Cnull%2Cnull%2Cnull%2C0%2C1%5D%2Cnull%2C3%2C%5B%5Bnull%2C1%2C%22eugene.f.begue%40gmail.com%22%2C%5Bnull%2Cnull%2C23%5D%2C2%2C%22en-US%22%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%220%22%2Cnull%2Cnull%2C%22AB2Xq4hcilCERh73EFWJVHXx-io2lhh1EhC8UD8%22%5D%5D%5D%5D`,
		"method": "POST"
	})

		// Exponentially delay the next request,
		// to avoid rate limit on Google.
		.then(() => { setTimeout(function() {addAlert(i+1)}, (Math.min(i || 2, 30) * 1000)) })
}

addAlert(0)
