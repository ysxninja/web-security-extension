async function getTabId() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
}

// Function to update Chrome icon based on toggle state
function updateIcon(enabled) {
  let iconPath = enabled ? "/icon-on.png" : "/icon-off.png"; // Use your own icons
  chrome.action.setIcon({ path: iconPath });
}

// Load toggle states from storage
document.addEventListener("DOMContentLoaded", async () => {
  chrome.storage.sync.get(["masterToggle", "toggleHidden", "toggleDisabled"], (data) => {
    document.getElementById("masterToggle").checked = data.masterToggle ?? false;
    document.getElementById("toggleHidden").checked = data.toggleHidden ?? false;
    document.getElementById("toggleDisabled").checked = data.toggleDisabled ?? false;

    // Apply stored settings
    executeFunction(toggleHiddenElements, data.toggleHidden);
    executeFunction(toggleDisabledElements, data.toggleDisabled);
    
    // Update icon
    updateIcon(data.masterToggle);
  });
});

// Save state and apply effects
const setupToggle = (id, func) => {
  document.getElementById(id).addEventListener("change", async (e) => {
    let checked = e.target.checked;
    chrome.storage.sync.set({ [id]: checked }); // Save state
    await executeFunction(func, checked);

    if (id === "masterToggle") {
      // Sync sub-toggles with Master Toggle
      document.getElementById("toggleHidden").checked = checked;
      document.getElementById("toggleDisabled").checked = checked;
      chrome.storage.sync.set({ toggleHidden: checked, toggleDisabled: checked });
      await executeFunction(toggleHiddenElements, checked);
      await executeFunction(toggleDisabledElements, checked);
      
      // Update icon
      updateIcon(checked);
    }
  });
};

setupToggle("masterToggle", () => {}); // Master toggle does not call a function directly
setupToggle("toggleHidden", toggleHiddenElements);
setupToggle("toggleDisabled", toggleDisabledElements);

// Extract and display functions (same as before)
const setupButton = (btnId, outputId, copyBtnId, func, formatFunc = (x) => x) => {
  document.getElementById(btnId).addEventListener("click", async () => {
    let result = await executeFunction(func);
    let outputDiv = document.getElementById(outputId);
    let copyBtn = document.getElementById(copyBtnId);

    if (result.length > 0) {
      outputDiv.innerHTML = result.map(item => `<div class="output-item">${formatFunc(item)}</div>`).join("");
      outputDiv.style.display = "block"; // Show results
      copyBtn.style.display = "inline-block"; // Show copy button
    }
  });

  document.getElementById(copyBtnId).addEventListener("click", () => {
    let text = document.getElementById(outputId).innerText;
    navigator.clipboard.writeText(text);
  });
};

// Same setup functions for buttons
setupButton("showWordlist", "wordlist", "copyWordlist", extractWordlist);
setupButton("showEndpoints", "endpoints", "copyEndpoints", extractEndpoints);
// Render
// setupButton("showInputFields", "inputFields", "copyInputFields", extractInputFields);
// Dont Render
setupButton("showInputFields", "inputFields", "copyInputFields", extractInputFields, (item) => item.replace(/</g, "&lt;").replace(/>/g, "&gt;")); // Escape HTML

// Function to execute content scripts
async function executeFunction(func, ...args) {
  let tabId = await getTabId();
  let [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });
  return result.result;
}

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

// Extract functions (same as before)
function extractInputFields() {
  return Array.from(document.querySelectorAll("input, textarea, select")).map(el => el.outerHTML);
}

function extractWordlist() {
  const words = document.documentElement.innerText.match(/[a-zA-Z_\-]+/g);
  return [...new Set(words)].sort();
}

function extractEndpoints() {
  const regex = /(?<=(['"`]))\/[a-zA-Z0-9_?&=\/\-#.]*(?=\1)/g;
  const results = new Set();
  document.documentElement.outerHTML.matchAll(regex).forEach(match => results.add(match[0]));
  return Array.from(results);
}
