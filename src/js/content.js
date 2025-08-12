class YouTubeLanguageFilter {
  constructor() {
    this.enabled = true;
    this.settings = { 
      strictMode: true, 
      hideVideos: true, 
      hideChannels: true,
      selectedLanguages: ['en'] // Varsayılan İngilizce
    };
    this.observer = null;
    this.urlObserver = null;
    this.popstateHandler = null;
    this.originalPushState = null;
    this.originalReplaceState = null;
    this.filterTimeout = null;
    this.debugMode = false; // Debug modu
    this.init();
  }

  async init() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideVideos', 'hideChannels', 'selectedLanguages', 'debugMode'
      ]);
      
      this.enabled = stored.enabled !== false;
      this.settings.strictMode = stored.strictMode !== false;
      this.settings.hideVideos = stored.hideVideos !== false;
      this.settings.hideChannels = stored.hideChannels !== false;
      this.settings.selectedLanguages = stored.selectedLanguages || ['en'];
      this.debugMode = stored.debugMode || false;
      
      // Language Service'i yapılandır
      window.LanguageService.setLanguages(this.settings.selectedLanguages);
      window.LanguageService.setStrictMode(this.settings.strictMode);
      
      // Debug modu aktifse console'a log yaz
      if (this.debugMode) {
        this.startDebugLogging();
      }
      
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

  // Debug logging başlat
  startDebugLogging() {
    this.debugTimer = setInterval(() => {
      const stats = window.LanguageService.getCacheStats();
      console.log('YuLaF Cache Stats:', stats);
    }, 30000); // 30 saniyede bir
  }

  // Message handler'a cache stats ekleme
  getCacheStats() {
    if (window.LanguageService && window.LanguageService.getCacheStats) {
      return window.LanguageService.getCacheStats();
    }
    return null;
  }

  handleStorageChanges(changes) {
    let shouldRestart = false;
    let languageChanged = false;
    
    if (changes.enabled && changes.enabled.newValue !== this.enabled) {
      this.enabled = changes.enabled.newValue;
      shouldRestart = true;
    }
    
    if (changes.selectedLanguages && JSON.stringify(changes.selectedLanguages.newValue) !== JSON.stringify(this.settings.selectedLanguages)) {
      this.settings.selectedLanguages = changes.selectedLanguages.newValue || ['en'];
      window.LanguageService.setLanguages(this.settings.selectedLanguages);
      languageChanged = true;
      shouldRestart = true;
    }
    
    for (const key in changes) {
      if (key in this.settings && key !== 'selectedLanguages' && changes[key].newValue !== this.settings[key]) {
        this.settings[key] = changes[key].newValue;
        if (key === 'strictMode') {
          window.LanguageService.setStrictMode(this.settings.strictMode);  // ← add this
        }
        shouldRestart = true;
      }
    }
    
    if (shouldRestart) {
      this.restartFiltering(languageChanged);
    }
  }

  restartFiltering(clearAll = false) {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    
    this.cleanupObservers();
    
    if (this.enabled) {
      if (clearAll) {
        window.DOMService.showAllHiddenContent();
        document.querySelectorAll('[data-language-filter-checked]').forEach(el => {
          el.removeAttribute('data-language-filter-checked');
        });
      }
      
      this.startFiltering();
    } else {
      this.stopFiltering();
    }
  }

  startFiltering() {
    if (!this.enabled) return;
    
    this.cleanupObservers();
    
    window.FilterService.filterContent(this.settings);
    
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
    
    if (this.debugTimer) {
      clearInterval(this.debugTimer);
      this.debugTimer = null;
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
        
      case 'getLanguages':
        sendResponse({ 
          languages: window.YT_FILTER_CONFIG ? window.YT_FILTER_CONFIG.languages : {}
        });
        break;
        
      case 'getCacheStats':
        sendResponse({ 
          stats: filter.getCacheStats(),
          success: true
        });
        break;
        
      case 'clearCache':
        if (window.LanguageService && window.LanguageService.clearCache) {
          window.LanguageService.clearCache();
          sendResponse({ success: true, message: 'Cache cleared successfully' });
        } else {
          sendResponse({ success: false, message: 'Cache service not available' });
        }
        break;
        
      case 'updateState':
        if (request.state) {
          let shouldRestart = false;
          let languageChanged = false;
          
          if (typeof request.state.enabled === 'boolean' && request.state.enabled !== filter.enabled) {
            filter.enabled = request.state.enabled;
            shouldRestart = true;
          }
          
          if (request.state.selectedLanguages && JSON.stringify(request.state.selectedLanguages) !== JSON.stringify(filter.settings.selectedLanguages)) {
            filter.settings.selectedLanguages = request.state.selectedLanguages;
            window.LanguageService.setLanguages(request.state.selectedLanguages);
            languageChanged = true;
            shouldRestart = true;
          }
          
          const settingsKeys = ['strictMode', 'hideVideos', 'hideChannels'];
          settingsKeys.forEach(key => {
            if (key in request.state && request.state[key] !== filter.settings[key]) {
              filter.settings[key] = request.state[key];
              if (key === 'strictMode') {
                window.LanguageService.setStrictMode(filter.settings.strictMode);
              }
              shouldRestart = true;
            }
          });
          
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
          settings: filter.settings,
          cacheStats: filter.getCacheStats()
        });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  }
  
  return true;
});