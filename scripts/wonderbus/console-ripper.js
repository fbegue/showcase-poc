//note: src: https://www.wonderbusfest.com/

let caps = document.querySelectorAll(".wp-element-caption"); let capsArr = Array.prototype.slice.call(caps);

let artistStrings = []
capsArr.forEach(c =>{
	artistStrings.push(c.innerText)
})

console.log(artistStrings)
