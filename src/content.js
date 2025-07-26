class YouTubeLanguageFilter {
  constructor() {
    this.enabled = true;
    this.settings = { 
      strictMode: true, 
      hideVideos: true, 
      hideChannels: true,
      selectedLanguage: 'en'
    };
    this.observer = null;
    this.urlObserver = null;
    this.popstateHandler = null;
    this.originalPushState = null;
    this.originalReplaceState = null;
    this.filterTimeout = null;
    this.init();
  }

  async init() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguage'
      ]);
      
      this.enabled = stored.enabled !== false;
      this.settings.strictMode = stored.strictMode !== false;
      this.settings.hideVideos = stored.hideVideos !== false;
      this.settings.hideChannels = stored.hideChannels !== false;
      this.settings.selectedLanguage = stored.selectedLanguage || 'en';
      
      // Dili ayarla
      window.LanguageService.setLanguage(this.settings.selectedLanguage);
      
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
          this.handleStorageChanges(changes);
        }
      });
      
      if (this.enabled) {
        this.startFiltering();
      }
    } catch (error) {
      console.error('Error initializing filter:', error);
    }
  }

  handleStorageChanges(changes) {
    let shouldRestart = false;
    let languageChanged = false;
    
    if (changes.enabled && changes.enabled.newValue !== this.enabled) {
      this.enabled = changes.enabled.newValue;
      shouldRestart = true;
    }
    
    if (changes.selectedLanguage && changes.selectedLanguage.newValue !== this.settings.selectedLanguage) {
      this.settings.selectedLanguage = changes.selectedLanguage.newValue;
      window.LanguageService.setLanguage(this.settings.selectedLanguage);
      languageChanged = true;
      shouldRestart = true;
    }
    
    for (const key in changes) {
      if (key in this.settings && key !== 'selectedLanguage' && changes[key].newValue !== this.settings[key]) {
        this.settings[key] = changes[key].newValue;
        shouldRestart = true;
      }
    }
    
    if (shouldRestart) {
      // Dil değişikliğinde anında restart yap
      this.restartFiltering(languageChanged);
    }
  }

  restartFiltering(clearAll = false) {
    // Mevcut timeout'u temizle
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    // Observer'ları anında temizle
    this.cleanupObservers();
    
    if (this.enabled) {
      if (clearAll) {
        // Dil değişikliğinde tüm içeriği göster ve attribute'ları temizle
        window.DOMService.showAllHiddenContent();
        // Tüm checked attribute'ları da temizle
        document.querySelectorAll('[data-language-filter-checked]').forEach(el => {
          el.removeAttribute('data-language-filter-checked');
        });
      }
      
      // Anında yeniden başlat (timeout'suz)
      this.startFiltering();
    } else {
      this.stopFiltering();
    }
  }

  startFiltering() {
    if (!this.enabled) return;
    
    // Observer'ları temizle
    this.cleanupObservers();
    
    // Anında filtreleme yap
    window.FilterService.filterContent(this.settings);
    
    // Mutation Observer
    this.observer = new MutationObserver(mutations => {
      if (!this.enabled) return;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              window.FilterService.processNewNode(node, this.settings);
            }
          });
        }
      });
    });
    
    this.observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false
    });

    // URL değişiklik takibi
    let lastUrl = location.href;
    
    this.urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        
        setTimeout(() => {
          if (this.enabled && location.href === currentUrl) {
            window.FilterService.filterContent(this.settings);
          }
        }, window.YT_FILTER_CONFIG.timing.urlChangeDelay);
      }
    });
    
    this.urlObserver.observe(document, { 
      subtree: true, 
      childList: true 
    });
    
    // History API
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;
    
    const self = this;
    history.pushState = function(...args) {
      self.originalPushState.apply(history, args);
      setTimeout(() => {
        if (self.enabled) {
          window.FilterService.filterContent(self.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    
    history.replaceState = function(...args) {
      self.originalReplaceState.apply(history, args);
      setTimeout(() => {
        if (self.enabled) {
          window.FilterService.filterContent(self.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    
    // Popstate
    this.popstateHandler = () => {
      setTimeout(() => {
        if (this.enabled) {
          window.FilterService.filterContent(this.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    window.addEventListener('popstate', this.popstateHandler);
  }

  cleanupObservers() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
  }

  stopFiltering() {
    this.cleanupObservers();
    
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
    }
    
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
    }
    
    window.DOMService.showAllHiddenContent();
  }

  toggle() {
    this.enabled = !this.enabled;
    chrome.storage.sync.set({ enabled: this.enabled });
    
    if (this.enabled) {
      this.startFiltering();
    } else {
      this.stopFiltering();
    }
    return this.enabled;
  }
}

const filter = new YouTubeLanguageFilter();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'toggle':
        sendResponse({ enabled: filter.toggle() });
        break;
        
      case 'updateState':
        if (request.state) {
          let shouldRestart = false;
          let languageChanged = false;
          
          // Enabled durumu değiştiyse
          if (typeof request.state.enabled === 'boolean' && request.state.enabled !== filter.enabled) {
            filter.enabled = request.state.enabled;
            shouldRestart = true;
          }
          
          // Dil değiştiyse
          if (request.state.selectedLanguage && request.state.selectedLanguage !== filter.settings.selectedLanguage) {
            filter.settings.selectedLanguage = request.state.selectedLanguage;
            window.LanguageService.setLanguage(request.state.selectedLanguage);
            languageChanged = true;
            shouldRestart = true;
          }
          
          // Diğer ayarlar
          const settingsKeys = ['strictMode', 'hideVideos', 'hideChannels'];
          settingsKeys.forEach(key => {
            if (key in request.state && request.state[key] !== filter.settings[key]) {
              filter.settings[key] = request.state[key];
              shouldRestart = true;
            }
          });
          
          // Gerekirse yeniden başlat
          if (shouldRestart || request.forceReload) {
            filter.restartFiltering(languageChanged);
          }
        }
        sendResponse({ 
          success: true, 
          state: { enabled: filter.enabled, settings: filter.settings } 
        });
        break;
        
      case 'getStatus':
        sendResponse({ 
          enabled: filter.enabled,
          settings: filter.settings
        });
        break;
        
      case 'resetStats':
        window.FilterService.resetStats();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  }
  
  // Return true to indicate async response
  return true;
});