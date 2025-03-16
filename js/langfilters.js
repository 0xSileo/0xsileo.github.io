const en_checkbox = document.querySelector("#en");
const fr_checkbox = document.querySelector("#fr");

// Function to update localStorage
function updateLocalStorage() {
    const filters = {
        english: en_checkbox.checked,
        french: fr_checkbox.checked
    };
    localStorage.setItem("languageFilters", JSON.stringify(filters));
}

// Add event listeners to detect changes
en_checkbox.addEventListener("change", updateLocalStorage);
fr_checkbox.addEventListener("change", updateLocalStorage);

// Load saved preferences on page load
document.addEventListener("DOMContentLoaded", () => {
    const savedFilters = JSON.parse(localStorage.getItem("languageFilters"));

    if (savedFilters) {
        en_checkbox.checked = savedFilters.english;
        fr_checkbox.checked = savedFilters.french;
    }
});
