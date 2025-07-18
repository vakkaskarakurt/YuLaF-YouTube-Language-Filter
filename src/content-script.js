class YouTubeEnglishFilter {
  constructor() {
    this.languageDetector = new LanguageDetector();
    this.videoProcessor = new VideoProcessor(this.languageDetector);
    this.settingsManager = new SettingsManager();
    this.observer = null;
    this.debug = null;
    
    this.init();
  }

  async init() {
    console.log('⚡ YouTube English Filter: Ultra Fast Mode');
    
    // Setup message listener FIRST
    this.setupMessageListener();
    
    DOMUtils.injectFilterStyles();
    console.log('🎨 Aggressive CSS injected');
    
    await this.settingsManager.loadSettings();
    
    if (!this.settingsManager.isEnabled) {
      document.body.classList.add('yef-filter-disabled');
    }
    
    this.settingsManager.onSettingsChange((isEnabled) => {
      this.videoProcessor.reprocessAllVideos(isEnabled);
    });
    
    this.settingsManager.setupMessageListener();
    
    this.loadELDAsync();
    this.fastInitialProcess();
    this.setupFastMutationObserver();
    
    if (localStorage.getItem('yef-debug') === 'true') {
      this.debug = new DebugConsole(this);
    }
    
    this.setupPerformanceMonitoring();
    
    setTimeout(() => DOMUtils.markPageAsLoaded(), 100);
  }

  // 🔧 Enhanced message listener
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Message received:', message);
      
      try {
        if (message.action === 'toggleFilter') {
          this.handleToggleFilter(message.enabled);
          sendResponse({ success: true, state: message.enabled });
        } else if (message.action === 'getStatus') {
          sendResponse({ 
            success: true, 
            enabled: this.settingsManager.isEnabled,
            stats: this.getQuickStats()
          });
        }
      } catch (error) {
        console.error('Message handling error:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Keep message channel open
    });
  }

  handleToggleFilter(enabled) {
    console.log(`🔄 Filter toggle received: ${enabled}`);
    this.settingsManager.isEnabled = enabled;
    this.videoProcessor.reprocessAllVideos(enabled);
    
    if (enabled) {
      document.body.classList.remove('yef-filter-disabled');
    } else {
      document.body.classList.add('yef-filter-disabled');
    }
  }

  getQuickStats() {
    return {
      videosProcessed: this.videoProcessor.stats.totalProcessed,
      cacheHitRate: this.languageDetector.getStats().hitRate,
      filterRate: this.videoProcessor.getStats().filterRate
    };
  }

  // Diğer metodlar aynı...
  async loadELDAsync() {
    try {
      await this.languageDetector.loadELD();
      console.log('✅ ELD loaded in background');
    } catch (error) {
      console.warn('⚠️ ELD loading failed, using fallback:', error);
    }
  }

  fastInitialProcess() {
    setTimeout(() => {
      this.videoProcessor.observeNewVideos();
      console.log('👁️ Intersection Observer started');
    }, 50);
  }

  setupFastMutationObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const fastProcess = DOMUtils.debounce(() => {
      this.videoProcessor.observeNewVideos();
    }, 100);

    this.observer = new MutationObserver(fastProcess);
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    
    console.log('👁️ Fast MutationObserver active');
  }

  getPageContext() {
    const url = window.location.href;
    const path = window.location.pathname;
    
    if (url.includes('/results?search_query=')) return 'search';
    if (url.includes('/trending')) return 'trending';
    if (path === '/' || path === '/feed/subscriptions') return 'homepage';
    if (url.includes('/shorts/')) return 'shorts';
    if (url.includes('/playlist')) return 'playlist';
    
    return 'unknown';
  }

  setupPerformanceMonitoring() {
    setInterval(() => {
      const stats = {
        language: this.languageDetector.getStats(),
        video: this.videoProcessor.getStats()
      };
      
      console.log('⚡ Fast Performance:', {
        cacheHitRate: stats.language.hitRate,
        videosProcessed: stats.video.totalProcessed,
        filterRate: stats.video.filterRate,
        cacheSize: stats.language.cache ? stats.language.cache.size : 'N/A'
      });
    }, 15000);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeEnglishFilter();
  });
} else {
  new YouTubeEnglishFilter();
}