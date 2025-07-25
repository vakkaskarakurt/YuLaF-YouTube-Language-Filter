class YouTubeEnglishFilter {
  constructor() {
    this.enabled = true;
    this.settings = { 
      strictMode: true, 
      hideComments: true, 
      hideVideos: true, 
      hideChannels: true
    };
    this.observer = null;
    this.urlObserver = null;
    this.popstateHandler = null;
    this.originalPushState = null;
    this.originalReplaceState = null;
    this.init();
  }

  async init() {
    try {
      // Ayarları yükle
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideComments', 'hideVideos', 'hideChannels'
      ]);
      
      this.enabled = stored.enabled !== false;
      this.settings.strictMode = stored.strictMode !== false;
      this.settings.hideComments = stored.hideComments !== false;
      this.settings.hideVideos = stored.hideVideos !== false;
      this.settings.hideChannels = stored.hideChannels !== false;
      
      // Storage değişikliklerini dinle
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
          let shouldRestart = false;
          
          if (changes.enabled && changes.enabled.newValue !== this.enabled) {
            this.enabled = changes.enabled.newValue;
            shouldRestart = true;
          }
          
          for (const key in changes) {
            if (key in this.settings && changes[key].newValue !== this.settings[key]) {
              this.settings[key] = changes[key].newValue;
              shouldRestart = true;
            }
          }
          
          if (shouldRestart) {
            if (this.enabled) {
              this.startFiltering();
            } else {
              this.stopFiltering();
            }
          }
        }
      });
      
      if (this.enabled) {
        this.startFiltering();
      }
    } catch (error) {
      console.error('Error initializing filter:', error);
    }
  }

  startFiltering() {
    if (!this.enabled) return;
    
    this.stopFiltering();
    
    // İlk filtreleme
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
    
    // History API değişikliklerini yakala
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      this.originalPushState.apply(history, args);
      setTimeout(() => {
        if (this.enabled) {
          window.FilterService.filterContent(this.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    
    history.replaceState = (...args) => {
      this.originalReplaceState.apply(history, args);
      setTimeout(() => {
        if (this.enabled) {
          window.FilterService.filterContent(this.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    
    // Popstate eventi
    this.popstateHandler = () => {
      setTimeout(() => {
        if (this.enabled) {
          window.FilterService.filterContent(this.settings);
        }
      }, window.YT_FILTER_CONFIG.timing.filterDelay);
    };
    window.addEventListener('popstate', this.popstateHandler);
  }

  stopFiltering() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
    }
    
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
    }
    
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
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

// Initialize
const filter = new YouTubeEnglishFilter();

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'toggle':
        sendResponse({ enabled: filter.toggle() });
        break;
        
      case 'updateState':
        if (request.state) {
          if (typeof request.state.enabled === 'boolean') {
            filter.enabled = request.state.enabled;
          }
          
          Object.assign(filter.settings, request.state);
          
          if (filter.enabled) {
            filter.startFiltering();
          } else {
            filter.stopFiltering();
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
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: error.message });
  }
});