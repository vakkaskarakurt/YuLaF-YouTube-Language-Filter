document.addEventListener('DOMContentLoaded', async () => {
  const enableFilter = document.getElementById('enableFilter');
  const statusText = document.getElementById('statusText');
  const languageSearch = document.getElementById('languageSearch');
  const languageOptions = document.getElementById('languageOptions');
  const selectedCount = document.getElementById('selectedCount');
  const sortButton = document.getElementById('sortButton');
  const sortDropdown = document.getElementById('sortDropdown');

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
          background-color: #ff0000;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          display: flex; justify-content: center; align-items: center;
        ">
          Go to YouTube
        </button>
        
        <div style="
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #333;
          width: 100%;
          max-width: 280px;
          justify-content: center;
        ">
          <button id="guideBtn" style="
            background-color: #ff0000;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Guide
          </button>
          
          <button id="feedbackBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Feedback
          </button>

          <button id="rateUsBtn" style="
            background-color: #FFA500;
            color: white;
            border: none;
            padding: 10px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 80px;
            display: flex; justify-content: center; align-items: center;
          ">
            Rate Us
          </button>
        </div>
        
        <p style="
          margin: 15px 0 0 0;
          font-size: 0.8rem;
          color: #666;
          font-style: italic;
        ">
          YouTube Language Filter
        </p>
      </div>
    `;
    
    // Add event listeners for the buttons
    setTimeout(() => {
      const goToYouTubeBtn = document.getElementById('goToYouTubeBtn');
      const guideBtn = document.getElementById('guideBtn');
      const feedbackBtn = document.getElementById('feedbackBtn');
      const rateUsBtn = document.getElementById('rateUsBtn');
      
      if (goToYouTubeBtn) {
        goToYouTubeBtn.addEventListener('click', () => {
          chrome.tabs.create({url: 'https://www.youtube.com'});
          window.close();
        });
        
        goToYouTubeBtn.addEventListener('mouseover', () => {
          goToYouTubeBtn.style.background = '#ff2222';
          goToYouTubeBtn.style.transform = 'translateY(-2px)';
          goToYouTubeBtn.style.boxShadow = '0 8px 25px rgba(255, 0, 0, 0.3)';
        });
        
        goToYouTubeBtn.addEventListener('mouseout', () => {
          goToYouTubeBtn.style.background = '#ff0000';
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
          guideBtn.style.background = '#ff2222';
          guideBtn.style.transform = 'translateY(-1px)';
          guideBtn.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
        });
        
        guideBtn.addEventListener('mouseout', () => {
          guideBtn.style.background = '#ff0000';
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
          feedbackBtn.style.background = '#66BB6A';
          feedbackBtn.style.transform = 'translateY(-1px)';
          feedbackBtn.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
        });
        
        feedbackBtn.addEventListener('mouseout', () => {
          feedbackBtn.style.background = '#4CAF50';
          feedbackBtn.style.transform = 'translateY(0)';
          feedbackBtn.style.boxShadow = 'none';
        });
      }

      if (rateUsBtn) {
        rateUsBtn.addEventListener('click', () => {
          chrome.tabs.create({url: 'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm'});
          window.close();
        });
        
        rateUsBtn.addEventListener('mouseover', () => {
          rateUsBtn.style.background = '#FF8C00';
          rateUsBtn.style.transform = 'translateY(-1px)';
          rateUsBtn.style.boxShadow = '0 4px 12px rgba(255, 165, 0, 0.3)';
        });
        
        rateUsBtn.addEventListener('mouseout', () => {
          rateUsBtn.style.background = '#FFA500';
          rateUsBtn.style.transform = 'translateY(0)';
          rateUsBtn.style.boxShadow = 'none';
        });
      }
    }, 100);
    
    return;
  }

  let currentState = {
    enabled: true,
    strictMode: true,
    hideVideos: true,
    hideChannels: true,
    selectedLanguages: ['en']
  };

  let languages = {};
  let currentSortBy = 'popularity';
  let listenersAdded = false; // Event listener tracking

  // Languages'ı config'den yükle
  async function loadLanguages() {
    try {
      console.log('Loading languages from content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLanguages' });
      console.log('Content script response:', response);
      if (response && response.languages) {
        languages = response.languages;
        console.log('Languages loaded from content script:', Object.keys(languages).length);
      } else {
        console.log('Using fallback language list');
        // Fallback - directly from config if content script not ready
        languages = {
          en: { code: 'en', name: 'English', nativeName: 'English', icon: '🇬🇧', enabled: false },
          es: { code: 'es', name: 'Spanish', nativeName: 'Español', icon: '🇪🇸', enabled: false },
          zh: { code: 'zh', name: 'Chinese', nativeName: '中文', icon: '🇨🇳', enabled: false },
          hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', icon: '🇮🇳', enabled: false },
          ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', icon: '🇸🇦', enabled: false },
          pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', icon: '🇵🇹', enabled: false },
          bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', icon: '🇧🇩', enabled: false },
          ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', icon: '🇷🇺', enabled: false },
          ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', icon: '🇯🇵', enabled: false },
          fr: { code: 'fr', name: 'French', nativeName: 'Français', icon: '🇫🇷', enabled: false },
          de: { code: 'de', name: 'German', nativeName: 'Deutsch', icon: '🇩🇪', enabled: false },
          ko: { code: 'ko', name: 'Korean', nativeName: '한국어', icon: '🇰🇷', enabled: false },
          it: { code: 'it', name: 'Italian', nativeName: 'Italiano', icon: '🇮🇹', enabled: false },
          tr: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', icon: '🇹🇷', enabled: false },
          vi: { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', icon: '🇻🇳', enabled: false },
          th: { code: 'th', name: 'Thai', nativeName: 'ไทย', icon: '🇹🇭', enabled: false },
          pl: { code: 'pl', name: 'Polish', nativeName: 'Polski', icon: '🇵🇱', enabled: false },
          nl: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', icon: '🇳🇱', enabled: false },
          sv: { code: 'sv', name: 'Swedish', nativeName: 'Svenska', icon: '🇸🇪', enabled: false },
          da: { code: 'da', name: 'Danish', nativeName: 'Dansk', icon: '🇩🇰', enabled: false },
          no: { code: 'no', name: 'Norwegian', nativeName: 'Norsk', icon: '🇳🇴', enabled: false },
          fi: { code: 'fi', name: 'Finnish', nativeName: 'Suomi', icon: '🇫🇮', enabled: false },
          cs: { code: 'cs', name: 'Czech', nativeName: 'Čeština', icon: '🇨🇿', enabled: false },
          hu: { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', icon: '🇭🇺', enabled: false },
          ro: { code: 'ro', name: 'Romanian', nativeName: 'Română', icon: '🇷🇴', enabled: false },
          bg: { code: 'bg', name: 'Bulgarian', nativeName: 'Български', icon: '🇧🇬', enabled: false },
          hr: { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', icon: '🇭🇷', enabled: false },
          sk: { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', icon: '🇸🇰', enabled: false },
          sl: { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', icon: '🇸🇮', enabled: false },
          et: { code: 'et', name: 'Estonian', nativeName: 'Eesti', icon: '🇪🇪', enabled: false },
          lv: { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', icon: '🇱🇻', enabled: false },
          lt: { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', icon: '🇱🇹', enabled: false },
          el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', icon: '🇬🇷', enabled: false },
          id: { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', icon: '🇮🇩', enabled: false },
          ms: { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', icon: '🇲🇾', enabled: false },
          tl: { code: 'tl', name: 'Filipino', nativeName: 'Filipino', icon: '🇵🇭', enabled: false },
          he: { code: 'he', name: 'Hebrew', nativeName: 'עברית', icon: '🇮🇱', enabled: false },
          fa: { code: 'fa', name: 'Persian', nativeName: 'فارسی', icon: '🇮🇷', enabled: false },
          ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', icon: '🇵🇰', enabled: false },
          ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', icon: '🇱🇰', enabled: false },
          te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', icon: '🇮🇳', enabled: false },
          ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', icon: '🇮🇳', enabled: false },
          kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', icon: '🇮🇳', enabled: false },
          gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', icon: '🇮🇳', enabled: false },
          pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', icon: '🇮🇳', enabled: false },
          sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', icon: '🇰🇪', enabled: false },
          af: { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', icon: '🇿🇦', enabled: false },
          am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', icon: '🇪🇹', enabled: false },
          ca: { code: 'ca', name: 'Catalan', nativeName: 'Català', icon: '🏳️', enabled: false },
          eu: { code: 'eu', name: 'Basque', nativeName: 'Euskera', icon: '🏳️', enabled: false },
          gl: { code: 'gl', name: 'Galician', nativeName: 'Galego', icon: '🏳️', enabled: false },
          cy: { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', icon: '🏴', enabled: false },
          ga: { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', icon: '🇮🇪', enabled: false },
          mt: { code: 'mt', name: 'Maltese', nativeName: 'Malti', icon: '🇲🇹', enabled: false },
          is: { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', icon: '🇮🇸', enabled: false },
          mk: { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', icon: '🇲🇰', enabled: false },
          sq: { code: 'sq', name: 'Albanian', nativeName: 'Shqip', icon: '🇦🇱', enabled: false },
          sr: { code: 'sr', name: 'Serbian', nativeName: 'Српски', icon: '🇷🇸', enabled: false },
          bs: { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', icon: '🇧🇦', enabled: false },
          uk: { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', icon: '🇺🇦', enabled: false },
          be: { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', icon: '🇧🇾', enabled: false }
        };
      }
    } catch (error) {
      console.log('Could not load languages from content script, using fallback:', error.message);
      console.log('Error details:', error);
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
    
    // ✅ Her durumda açık tut - diller yüklenmişse
    if (Object.keys(languages).length > 0) {
      languageOptions.classList.add('expanded');
    }
    
    const filteredLanguages = Object.entries(languages).filter(([code, lang]) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return lang.name.toLowerCase().includes(term) || 
             lang.nativeName.toLowerCase().includes(term) ||
             code.toLowerCase().includes(term);
    });

    // Sık kullanılan dillerin sırasını tanımla
    const popularityOrder = [
      'en', 'es', 'zh', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'fr',
      'de', 'ko', 'it', 'tr', 'vi', 'th', 'pl', 'nl', 'sv', 'da',
      'no', 'fi', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et',
      'lv', 'lt', 'el', 'id', 'ms', 'tl', 'he', 'fa', 'ur', 'ta',
      'te', 'ml', 'kn', 'gu', 'pa', 'sw', 'af', 'am', 'ca', 'eu',
      'gl', 'cy', 'ga', 'mt', 'is', 'mk', 'sq', 'sr', 'bs', 'uk', 'be'
    ];

    // Sort languages based on current sort preference
    filteredLanguages.sort(([codeA, langA], [codeB, langB]) => {
      const aSelected = currentState.selectedLanguages.includes(codeA);
      const bSelected = currentState.selectedLanguages.includes(codeB);
      
      // Seçili diller her zaman önce gelir
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Sort by selected method
      if (currentSortBy === 'name') {
        return langA.name.localeCompare(langB.name);
      } else { // popularity
        const aIndex = popularityOrder.indexOf(codeA);
        const bIndex = popularityOrder.indexOf(codeB);
        
        // Eğer ikisi de listede varsa, sırasına göre
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // Eğer biri listede yoksa, alfabetik sırala
        if (aIndex === -1 && bIndex !== -1) return 1;
        if (aIndex !== -1 && bIndex === -1) return -1;
        
        // Her ikisi de listede yoksa alfabetik
        return langA.name.localeCompare(langB.name);
      }
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
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguages', 'sortBy'
      ]);
      
      currentState = {
        enabled: stored.enabled !== false,
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: stored.selectedLanguages || ['en']
      };
      
      currentSortBy = stored.sortBy || 'popularity';

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
    // ✅ Sadece UI'ı güncelle, event listener manipülasyonu yok
    enableFilter.checked = state.enabled;
    updateStatusText(state.enabled);
    updateLanguageSelectorVisibility(state.enabled);
    updateSortUI();
    renderLanguages();
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
    // ✅ Her input'ta listeyi aç
    if (!languageOptions.classList.contains('expanded')) {
      languageOptions.classList.add('expanded');
    }
    
    renderLanguages(e.target.value);
    
    // ✅ Diller yüklenmemişse retry
    if (Object.keys(languages).length === 0) {
      setTimeout(async () => {
        await loadLanguages();
        renderLanguages(e.target.value);
      }, 100);
    }
  }

  function handleSearchFocus(e) {
    console.log('Search focus triggered, languages count:', Object.keys(languages).length);
    
    // ✅ Her durumda listeyi aç
    languageOptions.classList.add('expanded');
    languageOptions.classList.add('force-open'); // CSS fallback
    
    // ✅ Diller yüklenmemişse yeniden yükle
    if (Object.keys(languages).length === 0) {
      console.log('Languages not loaded, retrying...');
      setTimeout(async () => {
        await loadLanguages();
        renderLanguages();
        languageOptions.classList.add('expanded');
      }, 50);
    }
    
    // ✅ Liste boşsa render et
    if (languageOptions.children.length === 0) {
      renderLanguages();
    }
  }

  function addEventListeners() {
    // ✅ Duplicate listener kontrolü
    if (listenersAdded) return;
    
    enableFilter.addEventListener('change', handleEnableChange);
    languageSearch.addEventListener('input', handleSearchInput);
    languageSearch.addEventListener('click', handleSearchFocus); // ✅ Click event önemli
    languageSearch.addEventListener('focus', handleSearchFocus);
    
    // Sort button and dropdown events
    if (sortButton) {
      sortButton.addEventListener('click', handleSortButtonClick);
    }
    
    if (sortDropdown) {
      sortDropdown.addEventListener('click', handleSortOptionClick);
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const languageSelector = document.querySelector('.language-selector');
      const sortContainer = document.querySelector('.sort-container');
      
      if (!languageSelector.contains(e.target)) {
        languageOptions.classList.remove('expanded');
        languageOptions.classList.remove('force-open');
      }
      
      if (!sortContainer.contains(e.target)) {
        sortDropdown.classList.remove('show');
        sortButton.classList.remove('active');
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

    // Strict Mode toggle listener
    const strictModeToggle = document.getElementById('strictModeToggle');
    if (strictModeToggle) {
      strictModeToggle.addEventListener('change', async (e) => {
        const newStrictMode = e.target.checked;
        await saveState({ strictMode: newStrictMode }, true);
      });
    }

    listenersAdded = true; // ✅ Flag set
  }

  function handleGuideClick() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/html/welcome.html')
    });
    window.close();
  }

  function handleFeedbackClick() {
    console.log('Feedback button clicked');
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/html/welcome.html')
    }, (tab) => {
      console.log('Welcome page opened, tab id:', tab.id);
      setTimeout(() => {
        console.log('Sending openFeedback message');
        chrome.tabs.sendMessage(tab.id, { action: 'openFeedback' }).then((response) => {
          console.log('Message sent successfully, response:', response);
        }).catch((error) => {
          console.log('Message failed:', error);
        });
      }, 2000);
    });
    window.close();
  }

  function handleRateUsClick() {
    chrome.tabs.create({
      url: 'https://chromewebstore.google.com/detail/yulaf-youtube-language-fi/ejfoldoabjeidjdddhomeaojicaemdpm'
    });
    window.close();
  }

  // Sort functionality functions
  function updateSortUI() {
    const sortText = document.querySelector('.sort-text');
    if (sortText) {
      sortText.textContent = `Sort by`;
    }
    
    const sortOptions = document.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
      option.classList.remove('active');
      if (option.dataset.sort === currentSortBy) {
        option.classList.add('active');
      }
    });
  }

  function handleSortButtonClick() {
    sortDropdown.classList.toggle('show');
    sortButton.classList.toggle('active');
  }

  async function handleSortOptionClick(e) {
    const target = e.target.closest('.sort-option');
    if (!target) return;
    
    const newSortBy = target.dataset.sort;
    if (newSortBy && newSortBy !== currentSortBy) {
      currentSortBy = newSortBy;
      
      await chrome.storage.sync.set({ sortBy: currentSortBy });
      
      updateSortUI();
      renderLanguages(languageSearch.value);
    }
    
    sortDropdown.classList.remove('show');
    sortButton.classList.remove('active');
  }

  // Storage değişikliklerini dinle
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
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

  // ✅ İlk yükleme - tek event listener setup
  try {
    await loadLanguages();
    await loadCurrentState();
    addEventListeners(); // ✅ Tek sefer event listener ekleme
    updateUI(currentState);
  } catch (error) {
    console.error('Error during initialization:', error);
    addEventListeners(); // ✅ Hata durumunda da event listener'ları ekle
    updateUI(currentState);
  }
});