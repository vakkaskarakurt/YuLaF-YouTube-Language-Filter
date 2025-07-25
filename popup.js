document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const settingsPanel = document.getElementById('settingsPanel');
  const strictMode = document.getElementById('strictMode');
  const hideVideos = document.getElementById('hideVideos');
  const hideChannels = document.getElementById('hideChannels');
  const resetStats = document.getElementById('resetStats');

  // Aktif tab'ı al
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab.url.includes('youtube.com')) {
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff; background: #0f0f0f;">Please visit YouTube to use this extension.</div>';
    return;
  }

  // SAĞLAM STATE YÖNETİMİ
  let currentState = {
    enabled: true,
    strictMode: true,
    hideVideos: true,
    hideChannels: true
  };

  // Storage'dan gerçek state'i al
  async function loadCurrentState() {
    try {
      // Storage'dan al
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels'
      ]);
      
      // Default değerlerle birleştir
      currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false
      };

      // Content script'ten de kontrol et
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
        if (response && typeof response.enabled === 'boolean') {
          // Content script'teki state ile senkronize et
          currentState.enabled = response.enabled;
          if (response.settings) {
            Object.assign(currentState, response.settings);
          }
        }
      } catch (error) {
        console.log('Content script not ready, using storage values');
      }

      return currentState;
    } catch (error) {
      console.error('Error loading state:', error);
      return currentState;
    }
  }

  // UI'yi state'e göre güncelle
  function updateUI(state) {
    enableFilter.checked = state.enabled;
    strictMode.checked = state.strictMode;
    hideVideos.checked = state.hideVideos;
    hideChannels.checked = state.hideChannels;
    
    updateStatusText(state.enabled);
    updateSettingsVisibility(state.enabled);
  }

  // State'i güvenli şekilde storage'a kaydet
  async function saveState(newState) {
    try {
      // Önce storage'ı güncelle
      await chrome.storage.sync.set(newState);
      
      // Sonra content script'e bildir
      try {
        await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateState', 
          state: newState 
        });
      } catch (error) {
        console.log('Content script update failed:', error);
      }
      
      // Local state'i güncelle
      Object.assign(currentState, newState);
      
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  // Ana toggle handler - tek source of truth
  enableFilter.addEventListener('change', async (e) => {
    // UI'yi anında güncelle (responsive feeling)
    const newEnabled = e.target.checked;
    updateStatusText(newEnabled);
    updateSettingsVisibility(newEnabled);
    
    // State'i kaydet
    const success = await saveState({ enabled: newEnabled });
    
    if (!success) {
      // Hata durumunda UI'yi geri çevir
      e.target.checked = !newEnabled;
      updateStatusText(!newEnabled);
      updateSettingsVisibility(!newEnabled);
      alert('Settings could not be saved. Please try again.');
    }
  });

  // Settings değişiklik handler'ları - debounced
  let settingsTimeout;
  function handleSettingChange() {
    clearTimeout(settingsTimeout);
    settingsTimeout = setTimeout(async () => {
      const newSettings = {
        strictMode: strictMode.checked,
        hideVideos: hideVideos.checked,
        hideChannels: hideChannels.checked
      };

      await saveState(newSettings);
    }, 300); // 300ms debounce
  }

  // Tüm setting checkbox'larına event listener ekle
  [strictMode, hideVideos, hideChannels].forEach(checkbox => {
    checkbox.addEventListener('change', handleSettingChange);
  });

  // Reset stats
  resetStats.addEventListener('click', async () => {
    try {
      await chrome.storage.local.set({ filterStats: { videos: 0, channels: 0 } });
      loadStatistics();
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  });

  // Storage değişikliklerini dinle (diğer tab'lardan)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      // State değişikliğini algıla
      let stateChanged = false;
      const newState = { ...currentState };
      
      for (const key in changes) {
        if (key in currentState && changes[key].newValue !== currentState[key]) {
          newState[key] = changes[key].newValue;
          stateChanged = true;
        }
      }
      
      if (stateChanged) {
        currentState = newState;
        updateUI(currentState);
      }
    }
  });

  // Utility functions
  function updateStatusText(enabled) {
    statusText.textContent = enabled ? 'Filter Enabled' : 'Filter Disabled';
    statusText.style.color = enabled ? '#ff0000' : '#aaa';
  }

  function updateSettingsVisibility(enabled) {
    settingsPanel.classList.toggle('disabled', !enabled);
  }

  function loadStatistics() {
    chrome.storage.local.get(['filterStats'], (result) => {
      const stats = result.filterStats || { videos: 0, channels: 0 };
      
      document.getElementById('videosHidden').textContent = stats.videos || 0;
      document.getElementById('channelsHidden').textContent = stats.channels || 0;
    });
  }

  // İlk yükleme
  try {
    await loadCurrentState();
    updateUI(currentState);
    loadStatistics();
  } catch (error) {
    console.error('Error during initialization:', error);
    // Fallback - default değerlerle UI'yi güncelle
    updateUI(currentState);
  }
});