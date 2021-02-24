/*Runs on load*/
var themePref = localStorage.getItem('theme');
const root = document.querySelector(':root');

/*Gets theme preference if set by user. Defaults to browser theme otherwise*/

if (themePref !== null) {
  root.classList.toggle(themePref);
}

/*Removes preference if it matches the browser theme. Customizes it otherwise */
function changeTheme() {
  var themePref = localStorage.getItem('theme');
  const root = document.querySelector(':root');
  if (themePref !== null) {
    /*This handles the case where there is a UI theme change while having
    an overridden theme */
    match = "(prefers-color-scheme: "+ themePref + ")"
    if (window.matchMedia(match).matches) {
      root.classList.toggle(themePref);
      if (themePref == "dark") {
        var themePref = "light"
      } else {
        var themePref = "dark"
      }
      localStorage.setItem('theme', themePref);
    } else { //Has overridden theme & changes it on site
      localStorage.removeItem('theme');
      }
  } else { //UI theme change & no overridden
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      var themePref = "dark"
    } else {
      var themePref = "light"
    }
  localStorage.setItem('theme', themePref);
  }
  root.classList.toggle(themePref);
}
