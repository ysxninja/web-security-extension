
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("masterToggle", (data) => {
    let iconPath = data.masterToggle ? "/icon-on.png" : "/icon-off.png";
    chrome.action.setIcon({ path: iconPath });
  });
});
