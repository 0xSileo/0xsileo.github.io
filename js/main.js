/*The following block handles the position
  of the profile pic on hover */

var introname = document.getElementById('introname')
var pic = document.getElementById('profile')
var introdiv = document.getElementById('okur')

introname.addEventListener('mousemove', function(event) {
  var x = event.clientX;
  var y = event.clientY;
  /* console.log(pic.height)*/
  pic.style.left = x + window.scrollX - pic.width/2 + 'px';
  pic.style.top = y + window.scrollY - 55 + 'px';
})
