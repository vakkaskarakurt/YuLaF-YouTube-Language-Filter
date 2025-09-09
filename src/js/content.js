class YouTubeLanguageFilter {
  constructor() {
    this.enabled = true;
    this.settings = {
      strictMode: true,
      hideVideos: true,
      hideChannels: true,
      selectedLanguages: ['en'] // default: English
    };
    this.observer = this.urlObserver = this.popstateHandler = null;
    this.originalPushState = this.originalReplaceState = null;
    this.filterTimeout = this.debugTimer = null;
    this.debugMode = false;
    this.init();
  }

  async init() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled','strictMode','hideVideos','hideChannels','selectedLanguages','debugMode'
      ]);
      this.enabled = stored.enabled !== false;
      Object.assign(this.settings, {
        strictMode: stored.strictMode !== false,
        hideVideos: stored.hideVideos !== false,
        hideChannels: stored.hideChannels !== false,
        selectedLanguages: stored.selectedLanguages || ['en']
      });
      this.debugMode = stored.debugMode || false;

      // Setup LanguageService
      window.LanguageService.setLanguages(this.settings.selectedLanguages);
      window.LanguageService.setStrictMode(this.settings.strictMode);

      if (this.debugMode) this.startDebugLogging();

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') this.handleStorageChanges(changes);
      });

      if (this.enabled) this.startFiltering();
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  startDebugLogging() {
    this.debugTimer = setInterval(() => {
      console.log('YuLaF Cache Stats:', window.LanguageService.getCacheStats?.());
    }, 30_000);
  }

  getCacheStats() {
    return window.LanguageService?.getCacheStats?.() || null;
  }

  handleStorageChanges(changes) {
    let shouldRestart = false, languageChanged = false;

    if (changes.enabled) {
      this.enabled = changes.enabled.newValue;
      shouldRestart = true;
    }
    if (changes.selectedLanguages) {
      this.settings.selectedLanguages = changes.selectedLanguages.newValue || ['en'];
      window.LanguageService.setLanguages(this.settings.selectedLanguages);
      languageChanged = true;
      shouldRestart = true;
    }
    for (const key of Object.keys(changes)) {
      if (key in this.settings && key !== 'selectedLanguages') {
        this.settings[key] = changes[key].newValue;
        if (key === 'strictMode') window.LanguageService.setStrictMode(this.settings.strictMode);
        shouldRestart = true;
      }
    }
    if (shouldRestart) this.restartFiltering(languageChanged);
  }

  restartFiltering(clearAll = false) {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.cleanupObservers();

    if (this.enabled) {
      if (clearAll) {
        window.DOMService.showAllHiddenContent();
        document.querySelectorAll('[data-language-filter-checked]')
          .forEach(el => el.removeAttribute('data-language-filter-checked'));
      }
      this.startFiltering();
    } else this.stopFiltering();
  }

  startFiltering() {
    if (!this.enabled) return;
    this.cleanupObservers();
    window.FilterService.filterContent(this.settings);

    // DOM observer
    this.observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        for (const node of m.addedNodes || []) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            window.FilterService.processNewNode(node, this.settings);
          }
        }
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });

    // URL changes (SPA navigation)
    let lastUrl = location.href;
    this.urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(() => {
          if (this.enabled && location.href === lastUrl)
            window.FilterService.filterContent(this.settings);
        }, window.YT_FILTER_CONFIG.timing.urlChangeDelay);
      }
    });
    this.urlObserver.observe(document, { childList: true, subtree: true });

    // History API patch
    this.originalPushState = history.pushState;
    this.originalReplaceState = history.replaceState;
    const wrapHistory = (method, fn) => function (...a) {
      fn.apply(history, a);
      setTimeout(() => this.enabled && window.FilterService.filterContent(this.settings),
        window.YT_FILTER_CONFIG.timing.filterDelay);
    }.bind(this);
    history.pushState = wrapHistory(history.pushState, this.originalPushState);
    history.replaceState = wrapHistory(history.replaceState, this.originalReplaceState);

    // Popstate handler
    this.popstateHandler = () =>
      setTimeout(() => this.enabled && window.FilterService.filterContent(this.settings),
        window.YT_FILTER_CONFIG.timing.filterDelay);
    window.addEventListener('popstate', this.popstateHandler);
  }

  cleanupObservers() {
    this.observer?.disconnect(); this.observer = null;
    this.urlObserver?.disconnect(); this.urlObserver = null;
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
    if (this.debugTimer) clearInterval(this.debugTimer), this.debugTimer = null;
  }

  stopFiltering() {
    this.cleanupObservers();
    if (this.originalPushState) history.pushState = this.originalPushState;
    if (this.originalReplaceState) history.replaceState = this.originalReplaceState;
    window.DOMService.showAllHiddenContent();
  }

  toggle() {
    this.enabled = !this.enabled;
    chrome.storage.sync.set({ enabled: this.enabled });
    this.enabled ? this.startFiltering() : this.stopFiltering();
    return this.enabled;
  }
}

const filter = new YouTubeLanguageFilter();

// Message listener
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  try {
    switch (req.action) {
      case 'toggle':
        return sendResponse({ enabled: filter.toggle() });
      case 'getLanguages':
        return sendResponse({ languages: window.YT_FILTER_CONFIG?.languages || {} });
      case 'getCacheStats':
        return sendResponse({ stats: filter.getCacheStats(), success: true });
      case 'clearCache':
        if (window.LanguageService?.clearCache) {
          window.LanguageService.clearCache();
          return sendResponse({ success: true, message: 'Cache cleared' });
        }
        return sendResponse({ success: false, message: 'Cache service not available' });
      case 'updateState':
        if (req.state) {
          let shouldRestart = false, languageChanged = false;
          if (typeof req.state.enabled === 'boolean' && req.state.enabled !== filter.enabled) {
            filter.enabled = req.state.enabled; shouldRestart = true;
          }
          if (req.state.selectedLanguages &&
              JSON.stringify(req.state.selectedLanguages) !== JSON.stringify(filter.settings.selectedLanguages)) {
            filter.settings.selectedLanguages = req.state.selectedLanguages;
            window.LanguageService.setLanguages(req.state.selectedLanguages);
            languageChanged = true; shouldRestart = true;
          }
          for (const k of ['strictMode','hideVideos','hideChannels']) {
            if (k in req.state && req.state[k] !== filter.settings[k]) {
              filter.settings[k] = req.state[k];
              if (k === 'strictMode') window.LanguageService.setStrictMode(filter.settings.strictMode);
              shouldRestart = true;
            }
          }
          if (shouldRestart || req.forceReload) filter.restartFiltering(languageChanged);
        }
        return sendResponse({ success: true, state: { enabled: filter.enabled, settings: filter.settings } });
      case 'getStatus':
        return sendResponse({ enabled: filter.enabled, settings: filter.settings, cacheStats: filter.getCacheStats() });
      default:
        return sendResponse({ error: 'Unknown action' });
    }
  } catch (e) {
    console.error('Message error:', e);
    sendResponse({ error: e.message });
  }
  return true;
});
