/*Assigning the height of the hamburger in javascript
because it is easier and because the height of the topnav
is determined by the height of the logotext + its padding*/

var logo = document.getElementsByClassName('topnav')[0]
var logoheightval = parseFloat(getComputedStyle(logo).height)

var navcontainer = document.getElementsByClassName('container')[0]
/*here the 3 bars are 2px high, and they have a margin of 10px*/
var tbpadding = (logoheightval - 3*2 - 4*10)/2
var allpadding = tbpadding+"px 0px"

navcontainer.style.padding = allpadding

function MobileMenu(x) {
  x.classList.toggle("open");
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
