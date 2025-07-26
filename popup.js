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
    selectedLanguages: ['en']
  };

  let isInitializing = true;

  async function loadCurrentState() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguages', 'selectedLanguage'
      ]);
      
      // Eski tek dil formatından yeni çoklu dil formatına geçiş
      let selectedLanguages = stored.selectedLanguages;
      if (!selectedLanguages && stored.selectedLanguage) {
        selectedLanguages = [stored.selectedLanguage];
        // Eski formatı güncelle
        chrome.storage.sync.set({ selectedLanguages: selectedLanguages });
        chrome.storage.sync.remove(['selectedLanguage']);
      }
      
      currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: selectedLanguages || ['en']
      };

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
    // Event listener'ları geçici olarak kaldır
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
    
    // Çoklu dil seçimini güncelle
    langEn.checked = state.selectedLanguages.includes('en');
    langTr.checked = state.selectedLanguages.includes('tr');
    
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
      Object.assign(currentState, updates);
      await chrome.storage.sync.set(updates);
      
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

  async function handleEnableChange(e) {
    if (isInitializing) return;
    
    const newEnabled = e.target.checked;
    updateStatusText(newEnabled);
    updateSettingsVisibility(newEnabled);
    
    const success = await saveState({ enabled: newEnabled }, true);
    
    if (!success) {
      e.target.checked = !newEnabled;
      updateStatusText(!newEnabled);
      updateSettingsVisibility(!newEnabled);
      alert('Settings could not be saved. Please try again.');
    }
  }

  // Çoklu dil değişikliği handler
  async function handleLanguageChange(e) {
    if (isInitializing) return;
    
    const language = e.target.value;
    const isChecked = e.target.checked;
    
    let newSelectedLanguages = [...currentState.selectedLanguages];
    
    if (isChecked) {
      // Dil ekleme
      if (!newSelectedLanguages.includes(language)) {
        newSelectedLanguages.push(language);
      }
    } else {
      // Dil çıkarma - en az bir dil seçili kalmalı
      if (newSelectedLanguages.length > 1) {
        newSelectedLanguages = newSelectedLanguages.filter(lang => lang !== language);
      } else {
        // Son dil kaldırılmaya çalışılıyorsa, checkbox'ı geri işaretle
        e.target.checked = true;
        alert('En az bir dil seçili olmalıdır.');
        return;
      }
    }
    
    currentState.selectedLanguages = newSelectedLanguages;
    
    try {
      await chrome.storage.sync.set({ selectedLanguages: newSelectedLanguages });
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'updateState', 
        state: { 
          ...currentState,
          selectedLanguages: newSelectedLanguages 
        },
        forceReload: true
      });
      
      if (!response || response.error) {
        console.warn('Content script response error:', response?.error);
        chrome.tabs.reload(tab.id);
      }
    } catch (error) {
      console.log('Error updating languages:', error);
      chrome.tabs.reload(tab.id);
    }
  }

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
      
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'resetStats' });
      } catch (error) {
        console.log('Could not send reset stats to content script');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  });

  // Storage değişikliklerini dinle
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && !isInitializing) {
      let stateChanged = false;
      const newState = { ...currentState };
      
      for (const key in changes) {
        if (key in currentState && JSON.stringify(changes[key].newValue) !== JSON.stringify(currentState[key])) {
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
    
    setTimeout(() => {
      isInitializing = false;
    }, 500);
  } catch (error) {
    console.error('Error during initialization:', error);
    updateUI(currentState);
    isInitializing = false;
  }
});