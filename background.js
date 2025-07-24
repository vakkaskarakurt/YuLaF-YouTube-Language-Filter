// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    enabled: true,
    strictMode: true,
    hideComments: true,
    hideVideos: true,   
    hideChannels: true
  });

  // Initialize statistics
  chrome.storage.local.set({
    filterStats: { videos: 0, comments: 0, channels: 0 }
  });
});

// Update badge text based on filter status
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
    color: enabled ? '#1a73e8' : '#666'
  });
}

// Initialize badge on startup
chrome.storage.sync.get(['enabled'], (result) => {
  updateBadge(result.enabled !== false);
});