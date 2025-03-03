async function getTabId() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.id;
}

document.getElementById("masterToggle").addEventListener("change", async (e) => {
  let checked = e.target.checked;
  document.getElementById("toggleHidden").checked = checked;
  document.getElementById("toggleDisabled").checked = checked;
  await executeFunction(toggleHiddenElements, checked);
  await executeFunction(toggleDisabledElements, checked);
});

document.getElementById("toggleHidden").addEventListener("change", async (e) => {
  let checked = e.target.checked;
  await executeFunction(toggleHiddenElements, checked);
});

document.getElementById("toggleDisabled").addEventListener("change", async (e) => {
  let checked = e.target.checked;
  await executeFunction(toggleDisabledElements, checked);
});

document.getElementById("showWordlist").addEventListener("click", async () => {
  let result = await executeFunction(extractWordlist);
  document.getElementById("wordlist").innerText = result.join("\n");
});

document.getElementById("showEndpoints").addEventListener("click", async () => {
  let result = await executeFunction(extractEndpoints);
  document.getElementById("endpoints").innerText = result.join("\n");
});

document.getElementById("showInputFields").addEventListener("click", async () => {
  let result = await executeFunction(extractInputFields);
  document.getElementById("inputFields").innerText = result.join("\n");
});

document.getElementById("showSecurityEvents").addEventListener("click", async () => {
  let result = await executeFunction(extractSecurityEvents);
  document.getElementById("securityEvents").innerText = result.join("\n");
});

async function executeFunction(func, ...args) {
  let tabId = await getTabId();
  let [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });
  return result.result;
}

function toggleHiddenElements(enable) {
  document.querySelectorAll('[hidden], [style*="display: none"]').forEach(el => {
    if (enable) {
      el.classList.add("highlight");
      el.removeAttribute("hidden");
      el.style.display = "block";
    } else {
      el.classList.remove("highlight");
      el.setAttribute("hidden", "true");
      el.style.display = "none";
    }
  });
}

function toggleDisabledElements(enable) {
  document.querySelectorAll('[disabled]').forEach(el => {
    if (enable) {
      el.classList.add("highlight");
      el.removeAttribute("disabled");
    } else {
      el.classList.remove("highlight");
      el.setAttribute("disabled", "true");
    }
  });
}

function extractInputFields() {
  return Array.from(document.querySelectorAll("input, textarea, select"))
    .map(el => el.outerHTML);
}

function extractSecurityEvents() {
  const securityEvents = [];
  document.querySelectorAll("*").forEach(el => {
    let listeners = getEventListeners(el) || {};
    if (listeners.message || listeners.postMessage) {
      securityEvents.push({ element: el.outerHTML, events: Object.keys(listeners) });
    }
  });
  return securityEvents.map(e => `${e.element} - Events: ${e.events.join(", ")}`);
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
