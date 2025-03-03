// Load stored settings and apply effects when the page loads
chrome.storage.sync.get(["toggleHidden", "toggleDisabled"], (data) => {
    if (data.toggleHidden) toggleHiddenElements(true);
    if (data.toggleDisabled) toggleDisabledElements(true);
});

// Listen for storage changes (e.g., when toggles are updated from popup)
chrome.storage.onChanged.addListener((changes) => {
    if (changes.toggleHidden) toggleHiddenElements(changes.toggleHidden.newValue);
    if (changes.toggleDisabled) toggleDisabledElements(changes.toggleDisabled.newValue);
});

// Function to toggle hidden elements
function toggleHiddenElements(enable) {
    document.querySelectorAll('[hidden], [style*="display: none"]').forEach(el => {
        if (enable) {
            el.removeAttribute("hidden");
            el.style.display = "block";
            el.style.outline = "2px solid lightcoral";
        } else {
            el.setAttribute("hidden", "true");
            el.style.display = "none";
            el.style.outline = "none";
        }
    });
}

// Function to toggle disabled elements
function toggleDisabledElements(enable) {
    document.querySelectorAll('[disabled]').forEach(el => {
        if (enable) {
            el.removeAttribute("disabled");
            el.style.outline = "2px solid lightcoral";
        } else {
            el.setAttribute("disabled", "true");
            el.style.outline = "none";
        }
    });
}
