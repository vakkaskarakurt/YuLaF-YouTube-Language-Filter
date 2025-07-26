document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const settingsPanel = document.getElementById('settingsPanel');
  const strictMode = document.getElementById('strictMode');
  const hideVideos = document.getElementById('hideVideos');
  const hideChannels = document.getElementById('hideChannels');
  const resetStats = document.getElementById('resetStats');
  const langEn = document.getElementById('langEn');
  const langTr = document.getElementById('langTr');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab.url.includes('youtube.com')) {
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: #fff; background: #0f0f0f;">Please visit YouTube to use this extension.</div>';
    return;
  }

  let currentState = {
    enabled: true,
    strictMode: true,
    hideVideos: true,
    hideChannels: true,
    selectedLanguage: 'en'
  };

  // İlk yükleme durumu
  let isInitializing = true;

  async function loadCurrentState() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguage'
      ]);
      
      currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguage: stored.selectedLanguage || 'en'
      };

      // Content script'ten state al ama hata durumunda devam et
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
        if (response && typeof response.enabled === 'boolean') {
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

  function updateUI(state) {
    // Event listener'ları geçici olarak kaldır (sonsuz döngü önleme)
    enableFilter.removeEventListener('change', handleEnableChange);
    langEn.removeEventListener('change', handleLanguageChange);
    langTr.removeEventListener('change', handleLanguageChange);
    strictMode.removeEventListener('change', handleSettingChange);
    hideVideos.removeEventListener('change', handleSettingChange);
    hideChannels.removeEventListener('change', handleSettingChange);
    
    // UI güncelle
    enableFilter.checked = state.enabled;
    strictMode.checked = state.strictMode;
    hideVideos.checked = state.hideVideos;
    hideChannels.checked = state.hideChannels;
    
    // Dil seçimini güncelle
    if (state.selectedLanguage === 'en') {
      langEn.checked = true;
      langTr.checked = false;
    } else if (state.selectedLanguage === 'tr') {
      langTr.checked = true;
      langEn.checked = false;
    }
    
    updateStatusText(state.enabled);
    updateSettingsVisibility(state.enabled);
    
    // Event listener'ları geri ekle
    setTimeout(() => {
      enableFilter.addEventListener('change', handleEnableChange);
      langEn.addEventListener('change', handleLanguageChange);
      langTr.addEventListener('change', handleLanguageChange);
      strictMode.addEventListener('change', handleSettingChange);
      hideVideos.addEventListener('change', handleSettingChange);
      hideChannels.addEventListener('change', handleSettingChange);
    }, 100);
  }

  async function saveState(updates, forceReload = false) {
    try {
      // Önce local state'i güncelle
      Object.assign(currentState, updates);
      
      // Storage'a kaydet
      await chrome.storage.sync.set(updates);
      
      // Content script'e gönder (başarısız olsa bile devam et)
      try {
        const fullState = { ...currentState };
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'updateState', 
          state: fullState,
          forceReload: forceReload
        });
        
        if (!response || response.error) {
          console.warn('Content script response error:', response?.error);
        }
      } catch (error) {
        console.log('Content script not available:', error.message);
        // Content script yoksa sayfayı yenile
        if (forceReload && error.message.includes('Could not establish connection')) {
          chrome.tabs.reload(tab.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error saving state:', error);
      return false;
    }
  }

  // Enable/Disable handler
  async function handleEnableChange(e) {
    if (isInitializing) return;
    
    const newEnabled = e.target.checked;
    updateStatusText(newEnabled);
    updateSettingsVisibility(newEnabled);
    
    const success = await saveState({ enabled: newEnabled }, true);
    
    if (!success) {
      // Hata durumunda geri al
      e.target.checked = !newEnabled;
      updateStatusText(!newEnabled);
      updateSettingsVisibility(!newEnabled);
      alert('Settings could not be saved. Please try again.');
    }
  }

  // Dil değişikliği handler
  async function handleLanguageChange(e) {
    if (isInitializing || !e.target.checked) return;
    
    const newLanguage = e.target.value;
    
    // Önce UI'yi güncelle
    if (newLanguage === 'en') {
      langEn.checked = true;
      langTr.checked = false;
    } else {
      langTr.checked = true;
      langEn.checked = false;
    }
    
    // State'i anında kaydet
    currentState.selectedLanguage = newLanguage;
    
    try {
      // Storage'a kaydet
      await chrome.storage.sync.set({ selectedLanguage: newLanguage });
      
      // Content script'e anında gönder
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'updateState', 
        state: { 
          ...currentState,
          selectedLanguage: newLanguage 
        },
        forceReload: true
      });
      
      if (!response || response.error) {
        console.warn('Content script response error:', response?.error);
        // Hata durumunda sayfayı yenile
        chrome.tabs.reload(tab.id);
      }
    } catch (error) {
      console.log('Error updating language:', error);
      // Content script yoksa sayfayı yenile
      chrome.tabs.reload(tab.id);
    }
  }

  // Diğer ayarlar için handler
  async function handleSettingChange(e) {
    if (isInitializing) return;
    
    const newSettings = {
      strictMode: strictMode.checked,
      hideVideos: hideVideos.checked,
      hideChannels: hideChannels.checked
    };

    await saveState(newSettings, true);
  }

  // Event listener'ları ekle
  enableFilter.addEventListener('change', handleEnableChange);
  langEn.addEventListener('change', handleLanguageChange);
  langTr.addEventListener('change', handleLanguageChange);
  strictMode.addEventListener('change', handleSettingChange);
  hideVideos.addEventListener('change', handleSettingChange);
  hideChannels.addEventListener('change', handleSettingChange);

  // Reset stats
  resetStats.addEventListener('click', async () => {
    try {
      await chrome.storage.local.set({ filterStats: { videos: 0, channels: 0 } });
      loadStatistics();
      
      // Content script'e reset mesajı gönder
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'resetStats' });
      } catch (error) {
        console.log('Could not send reset stats to content script');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  });

  // Storage değişikliklerini dinle (başka bir yerden değişirse)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && !isInitializing) {
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

  function updateStatusText(enabled) {
    statusText.textContent = enabled ? 'Filter Enabled' : 'Filter Disabled';
    statusText.style.color = enabled ? '#ff0000' : '#aaa';
  }

  function updateSettingsVisibility(enabled) {
    if (enabled) {
      settingsPanel.classList.remove('disabled');
      document.querySelector('.language-selector').classList.remove('disabled');
    } else {
      settingsPanel.classList.add('disabled');
      document.querySelector('.language-selector').classList.add('disabled');
    }
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
    
    // İlk yükleme tamamlandı
    setTimeout(() => {
      isInitializing = false;
    }, 500);
  } catch (error) {
    console.error('Error during initialization:', error);
    updateUI(currentState);
    isInitializing = false;
  }
});