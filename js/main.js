/*The following block handles the position of the profile pic on hover */

var introname = document.getElementById('introname')
var pic = document.getElementById('profile')

introname.addEventListener('mousemove', function(event) {
  var x = event.clientX;
  var y = event.clientY;
  pic.style.left = x + window.scrollX - pic.width/2 + 'px';
  pic.style.top = y + window.scrollY - pic.height/2 + 'px';
})