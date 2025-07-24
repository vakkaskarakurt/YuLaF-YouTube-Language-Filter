document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const settingsPanel = document.getElementById('settingsPanel');
  const strictMode = document.getElementById('strictMode');
  const hideVideos = document.getElementById('hideVideos');
  const hideComments = document.getElementById('hideComments');
  const hideChannels = document.getElementById('hideChannels');
  const resetStats = document.getElementById('resetStats');

  // Load current status and settings
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (tab.url.includes('youtube.com')) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      
      enableFilter.checked = response.enabled;
      updateStatusText(response.enabled);
      
      strictMode.checked = response.settings.strictMode;
      hideVideos.checked = response.settings.hideVideos;
      hideComments.checked = response.settings.hideComments;
      hideChannels.checked = response.settings.hideChannels;
      
      updateSettingsVisibility(response.enabled);
    } catch (error) {
      console.log('Content script not ready:', error);
    }
  } else {
    // Not on YouTube
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Please visit YouTube to use this extension.</div>';
    return;
  }

  // Load and display statistics
  loadStatistics();

  // Event listeners
  enableFilter.addEventListener('change', async () => {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
      updateStatusText(response.enabled);
      updateSettingsVisibility(response.enabled);
    } catch (error) {
      console.error('Error toggling filter:', error);
    }
  });

  // Settings change handlers
  [strictMode, hideVideos, hideComments, hideChannels].forEach(checkbox => {
    checkbox.addEventListener('change', async () => {
      const settings = {
        strictMode: strictMode.checked,
        hideVideos: hideVideos.checked,
        hideComments: hideComments.checked,
        hideChannels: hideChannels.checked
      };

      try {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateSettings', 
          settings: settings 
        });
      } catch (error) {
        console.error('Error updating settings:', error);
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