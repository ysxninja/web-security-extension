async function getTabId() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
}

// Master Toggle
document.getElementById("masterToggle").addEventListener("change", async (e) => {
  let checked = e.target.checked;
  document.getElementById("toggleHidden").checked = checked;
  document.getElementById("toggleDisabled").checked = checked;
  await executeFunction(toggleHiddenElements, checked);
  await executeFunction(toggleDisabledElements, checked);
});

// Individual Toggles
document.getElementById("toggleHidden").addEventListener("change", async (e) => {
  await executeFunction(toggleHiddenElements, e.target.checked);
});

document.getElementById("toggleDisabled").addEventListener("change", async (e) => {
  await executeFunction(toggleDisabledElements, e.target.checked);
});

// Extract and display results
const setupButton = (btnId, outputId, copyBtnId, func, formatFunc = (x) => x) => {
  document.getElementById(btnId).addEventListener("click", async () => {
    let result = await executeFunction(func);
    let outputDiv = document.getElementById(outputId);
    let copyBtn = document.getElementById(copyBtnId);

    if (result.length > 0) {
      outputDiv.innerHTML = result.map(item => `<div class="output-item">${formatFunc(item)}</div>`).join("");
      outputDiv.style.display = "block"; // Show the result card
      copyBtn.style.display = "inline-block"; // Show the copy button
    }
  });

  document.getElementById(copyBtnId).addEventListener("click", () => {
    let text = document.getElementById(outputId).innerText;
    navigator.clipboard.writeText(text);
  });
};

setupButton("showWordlist", "wordlist", "copyWordlist", extractWordlist);
setupButton("showEndpoints", "endpoints", "copyEndpoints", extractEndpoints);
setupButton("showInputFields", "inputFields", "copyInputFields", extractInputFields, (item) => item.replace(/</g, "&lt;").replace(/>/g, "&gt;")); // Escape HTML

// Execute function in content script
async function executeFunction(func, ...args) {
  let tabId = await getTabId();
  let [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });
  return result.result;
}

// Modify elements styling
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

// Extract inputs (as text, not rendered elements)
function extractInputFields() {
  return Array.from(document.querySelectorAll("input, textarea, select")).map(el => el.outerHTML);
}

// Extract words from page text
function extractWordlist() {
  const words = document.documentElement.innerText.match(/[a-zA-Z_\-]+/g);
  return [...new Set(words)].sort();
}

// Extract API endpoints from scripts and HTML
function extractEndpoints() {
  const regex = /(?<=(['"`]))\/[a-zA-Z0-9_?&=\/\-#.]*(?=\1)/g;
  const results = new Set();
  document.documentElement.outerHTML.matchAll(regex).forEach(match => results.add(match[0]));
  return Array.from(results);
}
