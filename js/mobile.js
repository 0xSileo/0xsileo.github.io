/*Assigning the height of the hamburger in javascript
because it is easier and because the height of the topnav
is determined by the height of the logotext + its padding*/

let logo = document.getElementsByClassName('topnav')[0]
let logoheightval = parseFloat(getComputedStyle(logo).height)

let navcontainer = document.getElementsByClassName('container')[0]
/*here the 3 bars are 2px high, and they have a margin of 10px*/
let tbpadding = (logoheightval - 3*2 - 4*10)/2
let allpadding = tbpadding+"px 0px"

navcontainer.style.padding = allpadding

function MobileMenu(x) {
  x.classList.toggle("open");
  const all = document.querySelector('*');
  var all_class = all.classList;
  var sidepanel = document.getElementById("mySidepanel");
  var sidelist = sidepanel.classList;
  if (! sidelist.contains("open")) {
    sidepanel.style.width = innerWidth + "px";
    sidepanel.style.height = innerHeight + "px";
    document.body.style.overflow = "hidden";
  } else {
    sidepanel.style.width = 0 + "px";
    sidepanel.style.height = 0 + "px";
    document.body.style.overflow = "visible"; /*default*/
  }
  sidelist.toggle("open")
}
