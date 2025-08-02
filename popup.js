document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const settingsPanel = document.getElementById('settingsPanel');
  const strictMode = document.getElementById('strictMode');
  const hideVideos = document.getElementById('hideVideos');
  const hideChannels = document.getElementById('hideChannels');
  const languageSearch = document.getElementById('languageSearch');
  const languageOptions = document.getElementById('languageOptions');
  const selectedCount = document.getElementById('selectedCount');

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
    selectedLanguages: ['en'] // Default English
  };

  let isInitializing = true;
  let languages = {};

  // Languages'ı config'den yükle
  async function loadLanguages() {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLanguages' });
      if (response && response.languages) {
        languages = response.languages;
      } else {
        // Fallback - directly from config if content script not ready
        languages = {
          en: { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧', enabled: false },
          fr: { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷', enabled: false },
          de: { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪', enabled: false },
          es: { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸', enabled: false },
          it: { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹', enabled: false },
          tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', icon: '🇹🇷', enabled: false },
          ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺', enabled: false },
          zh: { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳', enabled: false },
          ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵', enabled: false },
          ko: { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷', enabled: false },
          ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', icon: '🇸🇦', enabled: false },
          hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳', enabled: false },
          pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', icon: '🇵🇹', enabled: false },
          nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', icon: '🇳🇱', enabled: false },
          pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', icon: '🇵🇱', enabled: false }
        };
      }
    } catch (error) {
      console.log('Could not load languages from content script, using fallback');
    }
  }

  function createLanguageElement(langCode, lang) {
    const option = document.createElement('label');
    option.className = 'language-option';
    option.innerHTML = `
      <input type="checkbox" name="language" value="${langCode}" 
             ${currentState.selectedLanguages.includes(langCode) ? 'checked' : ''}>
      <span class="language-label">
        <span class="flag">${lang.icon}</span>
        <span class="language-text">
          <span class="language-name">${lang.name}</span>
          <span class="language-native">${lang.nativeName}</span>
        </span>
      </span>
    `;
    
    const checkbox = option.querySelector('input');
    checkbox.addEventListener('change', handleLanguageChange);
    
    return option;
  }

  function renderLanguages(searchTerm = '') {
    languageOptions.innerHTML = '';
    
    const filteredLanguages = Object.entries(languages).filter(([code, lang]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || 
             lang.nativeName.toLowerCase().includes(term) ||
             code.toLowerCase().includes(term);
    });

    // Önce seçili diller, sonra alfabetik sıra
    filteredLanguages.sort(([codeA, langA], [codeB, langB]) => {
      const aSelected = currentState.selectedLanguages.includes(codeA);
      const bSelected = currentState.selectedLanguages.includes(codeB);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      return langA.name.localeCompare(langB.name);
    });

    filteredLanguages.forEach(([code, lang]) => {
      languageOptions.appendChild(createLanguageElement(code, lang));
    });

    updateSelectedCount();
  }

  function updateSelectedCount() {
    selectedCount.textContent = currentState.selectedLanguages.length;
  }

  async function loadCurrentState() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguages'
      ]);
      
      currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: stored.selectedLanguages || ['en']
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
    removeEventListeners();
    
    // UI güncelle
    enableFilter.checked = state.enabled;
    strictMode.checked = state.strictMode;
    hideVideos.checked = state.hideVideos;
    hideChannels.checked = state.hideChannels;
    
    updateStatusText(state.enabled);
    updateSettingsVisibility(state.enabled);
    renderLanguages();
    
    // Event listener'ları geri ekle
    setTimeout(addEventListeners, 100);
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

  async function handleLanguageChange(e) {
    if (isInitializing) return;
    
    const language = e.target.value;
    const isChecked = e.target.checked;
    
    let newSelectedLanguages = [...currentState.selectedLanguages];
    
    if (isChecked) {
      if (!newSelectedLanguages.includes(language)) {
        newSelectedLanguages.push(language);
      }
    } else {
      newSelectedLanguages = newSelectedLanguages.filter(lang => lang !== language);
    }
    
    currentState.selectedLanguages = newSelectedLanguages;
    updateSelectedCount();
    
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

  function handleSearchInput(e) {
    renderLanguages(e.target.value);
  }

  function addEventListeners() {
    enableFilter.addEventListener('change', handleEnableChange);
    strictMode.addEventListener('change', handleSettingChange);
    hideVideos.addEventListener('change', handleSettingChange);
    hideChannels.addEventListener('change', handleSettingChange);
    languageSearch.addEventListener('input', handleSearchInput);
  }

  function removeEventListeners() {
    enableFilter.removeEventListener('change', handleEnableChange);
    strictMode.removeEventListener('change', handleSettingChange);
    hideVideos.removeEventListener('change', handleSettingChange);
    hideChannels.removeEventListener('change', handleSettingChange);
    languageSearch.removeEventListener('input', handleSearchInput);
  }

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

  // İlk yükleme
  try {
    await loadLanguages();
    await loadCurrentState();
    updateUI(currentState);
    
    setTimeout(() => {
      isInitializing = false;
    }, 500);
  } catch (error) {
    console.error('Error during initialization:', error);
    updateUI(currentState);
    isInitializing = false;
  }
});