// Badge update function with better error handling
async function updateBadge(enabled) {
  try {
    const badgeText = enabled ? 'ON' : 'OFF';
    // Use darker red for better text contrast (Chrome auto-selects white text on dark backgrounds)
    const badgeColor = enabled ? '#CC0000' : '#666666';
    
    // Set badge globally
    await chrome.action.setBadgeText({ text: badgeText });
    await chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    
    // Also update for all existing YouTube tabs
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.action.setBadgeText({ text: badgeText, tabId: tab.id });
          await chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tab.id });
        } catch (e) {
          console.log('Badge update failed for tab:', tab.id);
        }
      }
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Initialize badge on startup
async function initializeBadge() {
  try {
    const result = await chrome.storage.sync.get(['enabled']);
    const enabled = result.enabled !== false; // Default to true if not set
    await updateBadge(enabled);
  } catch (error) {
    console.error('Error initializing badge:', error);
    // Default to showing ON if there's an error
    await updateBadge(true);
  }
}

// On install or update
chrome.runtime.onInstalled.addListener(async (details) => {
  // Set default values
  const defaults = {
    enabled: true,
    strictMode: true,
    hideVideos: true,
    hideChannels: true,
    selectedLanguages: ['en']
  };
  
  await chrome.storage.sync.set(defaults);
  
  // Initialize badge immediately
  await updateBadge(true);

  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/html/welcome.html') });
  } else if (details.reason === 'update') {
    // Re-initialize badge on update
    await initializeBadge();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync' && changes.enabled) {
    await updateBadge(changes.enabled.newValue);
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge' && typeof request.enabled === 'boolean') {
    updateBadge(request.enabled).then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Will respond asynchronously
  }
});

// Tab activation - refresh badge for active tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.includes('youtube.com')) {
      await initializeBadge();
    }
  } catch (error) {
    console.log('Tab activation badge update error:', error);
  }
});

// Tab update - refresh badge when URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    const result = await chrome.storage.sync.get(['enabled']);
    const enabled = result.enabled !== false;
    try {
      await chrome.action.setBadgeText({ text: enabled ? 'ON' : 'OFF', tabId: tabId });
      await chrome.action.setBadgeBackgroundColor({ color: enabled ? '#ff0000' : '#666666', tabId: tabId });
    } catch (e) {
      console.log('Badge update failed for tab:', tabId);
    }
  }
});

// Window focus change - refresh badge
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    try {
      const window = await chrome.windows.get(windowId, { populate: true });
      const activeTab = window.tabs.find(tab => tab.active);
      if (activeTab && activeTab.url && activeTab.url.includes('youtube.com')) {
        await initializeBadge();
      }
    } catch (error) {
      console.log('Window focus badge update error:', error);
    }
  }
});

// Initialize badge immediately when service worker starts
initializeBadge();

// Periodic badge refresh to ensure visibility (every 60 seconds)
// Reduced frequency to avoid excessive updates
const REFRESH_INTERVAL = 60000; // 1 minute
setInterval(() => {
  initializeBadge();
}, REFRESH_INTERVAL);

// Also refresh badge when extension starts or Chrome starts
chrome.runtime.onStartup.addListener(() => {
  initializeBadge();
});

// Ensure badge is visible when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  await initializeBadge();
});