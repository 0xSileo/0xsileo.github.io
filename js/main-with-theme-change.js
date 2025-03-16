/*The following block handles the position
  of the profile pic on hover */

var introname = document.getElementById('introname')
let bits = document.getElementById('bits')
let atoms = document.getElementById('atoms')
var pic = document.getElementById('profile')
var introdiv = document.getElementById('okur')
const root = document.querySelector(":root")
const html = document.querySelector("html")

let isAtom = true;

introname.addEventListener('mousemove', function(event) {
  var x = event.clientX;
  var y = event.clientY;
  /* console.log(pic.height)*/
  pic.style.left = x + window.scrollX - pic.width/2 + 'px';
  pic.style.top = y + window.scrollY - pic.height/2 + 'px';
})

/*introname.addEventListener('mouseover', function(event) {
  isAtom = !isAtom;
  introname.innerText = isAtom ? "Raphaël" : "Sileo"
  atoms.style.color = isAtom ? "var(--accent-color)" : ""
  bits.style.color = isAtom ? "" : "var(--accent-color)" 
})
*/

/*
const root = document.querySelector(":root")
console.log(root.style);

let theme = root.style.colorScheme;
console.log(theme)
if (!["light","dark"].includes(theme)) {
  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light";
  console.log(theme)
}

let pseudonym = theme == "light" ? "Raphaël" : "Sileo"
document.querySelector("#introname").textContent = pseudonym
*/


function switchMode(mode) {
  html.style.setProperty("color-scheme", mode === "auto" ? "light dark" : mode);
}


bits.addEventListener('click', function(event) {
  switchMode("dark")
  introname.textContent = "51730"
  introname.style.color = "var(--accent-color)"
})

atoms.addEventListener('click', function(event) {
  switchMode("light")
  introname.textContent = "Sileo"
  introname.style.color = "var(--accent-color)"
})

bits.addEventListener('mouseover', function(event) {
  atoms.style.padding = "0px"
})

atoms.addEventListener('mouseover', function(event) {
  bits.style.padding = "0px"
})