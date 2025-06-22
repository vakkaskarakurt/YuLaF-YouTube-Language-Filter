// background.js
chrome.runtime.onInstalled.addListener(function() {
  // Set default state
  chrome.storage.sync.set({ filterEnabled: true });
  
  // Optional: Open YouTube when extension is installed
  // chrome.tabs.create({ url: 'https://www.youtube.com' });
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    // Content script should auto-inject based on manifest, but this ensures it's loaded
    chrome.tabs.sendMessage(tabId, { action: 'ping' }, function(response) {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet
        console.log('Content script not ready yet');
      }
    });
  }
});