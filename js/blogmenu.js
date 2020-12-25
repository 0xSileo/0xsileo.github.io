/*https://stackoverflow.com/a/65450485/10860121*/

const observer = new IntersectionObserver((entries) => {
    for (let i of entries) {
        i.target.classList.toggle(
            "is-pinned", i.boundingClientRect.y < 0);
    }
}, {threshold: [0, 1]});

document.querySelectorAll(".blogyear").forEach(i => observer.observe(i));
document.querySelectorAll(".blogmonth").forEach(i => observer.observe(i));
