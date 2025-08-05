chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.set({
    enabled: true,
    strictMode: true,
    hideVideos: true,   
    hideChannels: true,
    selectedLanguages: ['en']
  });

  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/html/welcome.html')
    });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

function updateBadge(enabled) {
  chrome.action.setBadgeText({
    text: enabled ? 'ON' : 'OFF'
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: enabled ? '#ff0000' : '#666'
  });
  
  chrome.action.setBadgeTextColor({
    color: '#FFFFFF'
  });
}

chrome.storage.sync.get(['enabled'], (result) => {
  updateBadge(result.enabled !== false);
});