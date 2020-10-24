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

/*window.transitionToPage = function(href) {
  document.querySelector('body').style.opacity = 0
  setTimeout(function() {
    window.location.href = href
    }, 500)
  }
*/

/*document.addEventListener('DOMContentLoaded', function(event) {
  document.querySelector('body').style.opacity = 1
})*/
const versions = {"fr": "/fr"}

function LangChange(element) {
  window.location.href = versions[element.lang]
}
