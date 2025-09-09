// On install or update
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.set({
    enabled: true,
    strictMode: true,
    hideVideos: true,
    hideChannels: true,
    selectedLanguages: ['en']
  });

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/html/welcome.html') });
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

// Update extension badge
function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#ff0000' : '#666' });
  chrome.action.setBadgeTextColor({ color: '#fff' });
}

// Init badge on load
chrome.storage.sync.get(['enabled'], (result) => {
  updateBadge(result.enabled !== false);
});
