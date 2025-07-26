chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    enabled: true,
    strictMode: true,
    hideVideos: true,   
    hideChannels: true,
    selectedLanguages: ['en'] // İlk yüklemede sadece İngilizce seçili
  });
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
    color: enabled ? '#1a73e8' : '#666'
  });
}

chrome.storage.sync.get(['enabled'], (result) => {
  updateBadge(result.enabled !== false);
});