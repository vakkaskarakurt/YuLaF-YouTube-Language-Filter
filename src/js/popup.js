document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const languageSearch = document.getElementById('languageSearch');
  const languageOptions = document.getElementById('languageOptions');
  const selectedCount = document.getElementById('selectedCount');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab.url.includes('youtube.com')) {
    document.body.style.cssText = 'margin: 0; padding: 0; overflow: hidden;';
    document.body.innerHTML = `
      <div style="
        width: 380px;
        min-height: 400px;
        padding: 40px 30px;
        background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
        color: #fff;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 18px;
        box-sizing: border-box;
        margin: 0;
        position: relative;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #ff0000, #ff4444);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 8px 25px rgba(255, 0, 0, 0.3);
          margin-bottom: 10px;
        ">
          🎯
        </div>
        
        <h2 style="
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
          color: #fff;
          line-height: 1.3;
        ">
          YuLaF is Ready!
        </h2>
        
        <p style="
          margin: 0;
          font-size: 1rem;
          color: #ccc;
          line-height: 1.5;
          max-width: 280px;
        ">
          Please visit <strong style="color: #ff4444;">YouTube</strong> to start filtering videos by language.
        </p>
        
        <button id="goToYouTubeBtn" style="
          background: linear-gradient(45deg, #ff0000, #ff4444);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        ">
          🚀 Go to YouTube
        </button>
        
        <div style="
          display: flex;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #333;
          width: 100%;
          max-width: 280px;
          justify-content: space-between;
        ">
          <button id="guideBtn" style="
            background: linear-gradient(45deg, #ff0000, #330000);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 130px;
          ">
            📖 Guide
          </button>
          
          <button id="feedbackBtn" style="
            background: linear-gradient(45deg, #330000, #ff0000);
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 130px;
          ">
            📝 Feedback
          </button>
        </div>
        
        <p style="
          margin: 15px 0 0 0;
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        ">
          YouTube Language Filter v1.0.3
        </p>
      </div>
    `;
    
    // Add event listeners for the buttons
    setTimeout(() => {
      const goToYouTubeBtn = document.getElementById('goToYouTubeBtn');
      const guideBtn = document.getElementById('guideBtn');
      const feedbackBtn = document.getElementById('feedbackBtn');
      
      if (goToYouTubeBtn) {
        goToYouTubeBtn.addEventListener('click', () => {
          chrome.tabs.create({url: 'https://www.youtube.com'});
          window.close();
        });
        
        goToYouTubeBtn.addEventListener('mouseover', () => {
          goToYouTubeBtn.style.background = 'linear-gradient(45deg, #ff2222, #ff6666)';
          goToYouTubeBtn.style.transform = 'translateY(-2px)';
          goToYouTubeBtn.style.boxShadow = '0 8px 25px rgba(255, 0, 0, 0.3)';
        });
        
        goToYouTubeBtn.addEventListener('mouseout', () => {
          goToYouTubeBtn.style.background = 'linear-gradient(45deg, #ff0000, #ff4444)';
          goToYouTubeBtn.style.transform = 'translateY(0)';
          goToYouTubeBtn.style.boxShadow = 'none';
        });
      }
      
      if (guideBtn) {
        guideBtn.addEventListener('click', () => {
          chrome.tabs.create({url: chrome.runtime.getURL('src/html/welcome.html')});
          window.close();
        });
        
        guideBtn.addEventListener('mouseover', () => {
          guideBtn.style.background = 'linear-gradient(45deg, #ff2222, #440000)';
          guideBtn.style.transform = 'translateY(-1px)';
          guideBtn.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
        });
        
        guideBtn.addEventListener('mouseout', () => {
          guideBtn.style.background = 'linear-gradient(45deg, #ff0000, #330000)';
          guideBtn.style.transform = 'translateY(0)';
          guideBtn.style.boxShadow = 'none';
        });
      }
      
      if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
          chrome.tabs.create({url: chrome.runtime.getURL('src/html/welcome.html')}, (tab) => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, { action: 'openFeedback' }).catch(() => {});
            }, 1500);
          });
          window.close();
        });
        
        feedbackBtn.addEventListener('mouseover', () => {
          feedbackBtn.style.background = 'linear-gradient(45deg, #440000, #ff2222)';
          feedbackBtn.style.transform = 'translateY(-1px)';
          feedbackBtn.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
        });
        
        feedbackBtn.addEventListener('mouseout', () => {
          feedbackBtn.style.background = 'linear-gradient(45deg, #330000, #ff0000)';
          feedbackBtn.style.transform = 'translateY(0)';
          feedbackBtn.style.boxShadow = 'none';
        });
      }
    }, 100);
    
    return;
  }

  let currentState = {
    enabled: true,
    strictMode: true,       // Varsayılan olarak true, UI'da gösterilmeyecek
    hideVideos: true,       // Varsayılan olarak true, UI'da gösterilmeyecek
    hideChannels: true,     // Varsayılan olarak true, UI'da gösterilmeyecek
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
        strictMode: stored.strictMode !== false,        // Varsayılan true
        hideVideos: stored.hideVideos !== false,        // Varsayılan true
        hideChannels: stored.hideChannels !== false,    // Varsayılan true
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
    
    updateStatusText(state.enabled);
    updateLanguageSelectorVisibility(state.enabled);
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
    updateLanguageSelectorVisibility(newEnabled);
    
    const success = await saveState({ enabled: newEnabled }, true);
    
    if (!success) {
      e.target.checked = !newEnabled;
      updateStatusText(!newEnabled);
      updateLanguageSelectorVisibility(!newEnabled);
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

  function handleSearchInput(e) {
    const languageOptions = document.getElementById('languageOptions');
    
    // Show options when typing
    if (!languageOptions.classList.contains('expanded')) {
      languageOptions.classList.add('expanded');
    }
    
    renderLanguages(e.target.value);
  }

  function handleSearchFocus(e) {
    const languageOptions = document.getElementById('languageOptions');
    languageOptions.classList.toggle('expanded');
  }

  function addEventListeners() {
    enableFilter.addEventListener('change', handleEnableChange);
    languageSearch.addEventListener('input', handleSearchInput);
    languageSearch.addEventListener('click', handleSearchFocus);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const languageOptions = document.getElementById('languageOptions');
      const languageSearch = document.getElementById('languageSearch');
      const languageSelector = document.querySelector('.language-selector');
      
      if (!languageSelector.contains(e.target)) {
        languageOptions.classList.remove('expanded');
      }
    });
    
    // Guide button
    const guideBtn = document.getElementById('guideBtn');
    if (guideBtn) {
      guideBtn.addEventListener('click', handleGuideClick);
    }
    
    // Feedback button
    const feedbackBtn = document.getElementById('feedbackBtn');
    if (feedbackBtn) {
      feedbackBtn.addEventListener('click', handleFeedbackClick);
    }

    // Rate Us button
    const rateUsBtn = document.getElementById('rateUsBtn');
    if (rateUsBtn) {
      rateUsBtn.addEventListener('click', handleRateUsClick);
    }
  }

  function handleGuideClick() {
    // Open guide (welcome page)
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/html/welcome.html')
    });
    // Close popup
    window.close();
  }

  function handleFeedbackClick() {
    console.log('Feedback button clicked'); // Debug log
    // Open feedback in welcome page with auto-opening form
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/html/welcome.html')
    }, (tab) => {
      console.log('Welcome page opened, tab id:', tab.id); // Debug log
      // Send message to open feedback modal after page loads
      setTimeout(() => {
        console.log('Sending openFeedback message'); // Debug log
        chrome.tabs.sendMessage(tab.id, { action: 'openFeedback' }).then((response) => {
          console.log('Message sent successfully, response:', response);
        }).catch((error) => {
          console.log('Message failed:', error);
        });
      }, 2000); // Uzun süre bekleyelim
    });
    // Close popup
    window.close();
  }

  function handleRateUsClick() {
    chrome.tabs.create({
      url: 'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm'
    });
    window.close();
  }

  function removeEventListeners() {
    enableFilter.removeEventListener('change', handleEnableChange);
    languageSearch.removeEventListener('input', handleSearchInput);
    languageSearch.removeEventListener('click', handleSearchFocus);
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

  function updateLanguageSelectorVisibility(enabled) {
    if (enabled) {
      document.querySelector('.language-selector').classList.remove('disabled');
    } else {
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