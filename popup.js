document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const settingsPanel = document.getElementById('settingsPanel');
  const strictMode = document.getElementById('strictMode');
  const hideVideos = document.getElementById('hideVideos');
  const hideComments = document.getElementById('hideComments');
  const hideChannels = document.getElementById('hideChannels');
  const useOriginalTitles = document.getElementById('useOriginalTitles');
  const resetStats = document.getElementById('resetStats');

  // Load current status and settings
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (tab.url.includes('youtube.com')) {
    // Storage'dan direkt oku
    const stored = await chrome.storage.sync.get([
      'enabled', 'strictMode', 'hideComments', 'hideVideos', 'hideChannels', 'useOriginalTitles'
    ]);
    
    const enabled = stored.enabled !== false;
    enableFilter.checked = enabled;
    updateStatusText(enabled);
    
    strictMode.checked = stored.strictMode !== false;
    hideVideos.checked = stored.hideVideos !== false;
    hideComments.checked = stored.hideComments !== false;
    hideChannels.checked = stored.hideChannels !== false;
    useOriginalTitles.checked = stored.useOriginalTitles !== false;
    
    updateSettingsVisibility(enabled);
    
    // Backup olarak content script'ten de dene
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      if (response) {
        enableFilter.checked = response.enabled;
        updateStatusText(response.enabled);
        updateSettingsVisibility(response.enabled);
      }
    } catch (error) {
      console.log('Content script not ready, using storage values:', error);
    }
  } else {
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Please visit YouTube to use this extension.</div>';
    return;
  }

  loadStatistics();

  // Event listeners
  enableFilter.addEventListener('change', async () => {
    const newEnabled = enableFilter.checked;
    
    // Storage'ı güncelle
    await chrome.storage.sync.set({ enabled: newEnabled });
    
    // Content script'e mesaj gönder
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
    } catch (error) {
      console.log('Content script message failed:', error);
    }
    
    updateStatusText(newEnabled);
    updateSettingsVisibility(newEnabled);
  });

  // Settings change handlers
  [strictMode, hideVideos, hideComments, hideChannels, useOriginalTitles].forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const settings = {
        strictMode: strictMode.checked,
        hideVideos: hideVideos.checked,
        hideComments: hideComments.checked,
        hideChannels: hideChannels.checked,
        useOriginalTitles: useOriginalTitles.checked
      };

      // Storage'ı güncelle
      await chrome.storage.sync.set(settings);

      // Content script'e mesaj gönder
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateSettings', 
          settings: settings 
        });
      } catch (error) {
        console.log('Content script settings update failed:', error);
      }
    });
  });

  resetStats.addEventListener('click', () => {
    chrome.storage.local.set({ filterStats: { videos: 0, comments: 0, channels: 0 } });
    loadStatistics();
  });

  function updateStatusText(enabled) {
    statusText.textContent = enabled ? 'Filter Enabled' : 'Filter Disabled';
    statusText.style.color = enabled ? '#1a73e8' : '#666';
  }

  function updateSettingsVisibility(enabled) {
    settingsPanel.classList.toggle('disabled', !enabled);
  }

  function loadStatistics() {
    chrome.storage.local.get(['filterStats'], (result) => {
      const stats = result.filterStats || { videos: 0, comments: 0, channels: 0 };
      
      document.getElementById('videosHidden').textContent = stats.videos || 0;
      document.getElementById('commentsHidden').textContent = stats.comments || 0;
      document.getElementById('channelsHidden').textContent = stats.channels || 0;
    });
  }
});