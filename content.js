class YouTubeEnglishFilter {
  constructor() {
    this.enabled = true;
    this.settings = { 
      strictMode: true, 
      hideComments: true, 
      hideVideos: true, 
      hideChannels: true 
    };
    this.init();
  }

  async init() {
    const stored = await chrome.storage.sync.get([
      'enabled', 'strictMode', 'hideComments', 'hideVideos', 'hideChannels'
    ]);
    
    this.enabled = stored.enabled !== false;
    this.settings.strictMode = stored.strictMode !== false;
    this.settings.hideComments = stored.hideComments !== false;
    this.settings.hideVideos = stored.hideVideos !== false;
    this.settings.hideChannels = stored.hideChannels !== false;
    
    if (this.enabled) this.startFiltering();
  }

  startFiltering() {
    this.filterContent();
    
    // DOM değişikliklerini izle
    new MutationObserver(mutations => {
      if (mutations.some(m => m.addedNodes.length)) {
        setTimeout(() => this.filterContent(), 100); // Daha hızlı tepki
      }
    }).observe(document.body, { childList: true, subtree: true });

    // URL değişikliklerini doğru şekilde izle
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(() => this.filterContent(), 500);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  filterContent() {
    if (!this.enabled) return;

    const selectors = {
      videos: [
        'ytd-video-renderer',
        'ytd-compact-video-renderer', 
        'ytd-grid-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-reel-item-renderer',
        'ytd-shorts-lockup-view-model',
        'ytm-shorts-lockup-view-model-v2'
      ].join(','),
      comments: [
        'ytd-comment-thread-renderer',
        'ytd-comment-renderer'
      ].join(','),
      channels: [
        'ytd-channel-renderer'
      ].join(',')
    };

    if (this.settings.hideVideos) {
      document.querySelectorAll(selectors.videos).forEach(el => 
        this.checkElement(el, 'video')
      );
    }
    
    if (this.settings.hideComments) {
      document.querySelectorAll(selectors.comments).forEach(el => 
        this.checkElement(el, 'comment')
      );
    }
    
    if (this.settings.hideChannels) {
      document.querySelectorAll(selectors.channels).forEach(el => 
        this.checkElement(el, 'channel')
      );
    }
  }

  async checkElement(element, type) {
    if (element.hasAttribute('data-english-filter-checked')) return;
    element.setAttribute('data-english-filter-checked', 'true');

    // ÖNEMLİ: Önce elementi gizle, sonra kontrol et
    this.hideElementTemporarily(element);

    const textSelectors = {
      video: [
        '#video-title', 
        '.ytd-video-meta-block #video-title',
        'h3 a',
        '#channel-name a', 
        '.ytd-channel-name a',
        '#text.ytd-channel-name'
      ],
      comment: [
        '#content-text', 
        '.comment-text',
        '#content'
      ],
      channel: [
        '#channel-title', 
        '.ytd-channel-name', 
        '#text'
      ]
    };

    let text = '';
    for (const selector of textSelectors[type]) {
      const el = element.querySelector(selector);
      if (el) {
        const content = el.textContent?.trim() || el.title?.trim() || '';
        if (content) {
          text += content + ' ';
        }
      }
    }

    if (text.trim()) {
      const isEnglish = await this.isEnglishText(text.trim());
      if (isEnglish) {
        // İngilizce ise göster
        this.showElement(element);
      } else {
        // İngilizce değilse kalıcı olarak gizle
        this.hideElement(element, type);
      }
    } else {
      // Text bulunamazsa güvenli tarafta kal ve göster
      this.showElement(element);
    }
  }

  // Geçici gizleme (kontrol sırasında)
  hideElementTemporarily(element) {
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.setAttribute('data-english-filter-temp-hidden', 'true');
  }

  // Elementi göster
  showElement(element) {
    element.style.visibility = '';
    element.style.opacity = '';
    element.style.display = '';
    element.removeAttribute('data-english-filter-temp-hidden');
    element.removeAttribute('data-english-filter-hidden');
  }

  isEnglishText(text) {
    if (!text || text.length < 3) return Promise.resolve(true);
    
    // Hızlı ASCII kontrolü
    if (/[^\u0000-\u007F]/.test(text)) {
      return Promise.resolve(false);
    }
    
    // Chrome dil tespiti
    return new Promise(resolve => {
      try {
        chrome.i18n.detectLanguage(text, result => {
          if (!result?.languages?.length) {
            resolve(true);
            return;
          }
          
          const topLang = result.languages[0];
          const isEnglish = topLang.language.startsWith('en');
          
          if (!result.isReliable && topLang.percentage < 70) {
            resolve(true);
          } else {
            resolve(isEnglish);
          }
        });
      } catch (error) {
        console.warn('Language detection failed:', error);
        resolve(true);
      }
    });
  }

  hideElement(element, type) {
    element.style.display = 'none';
    element.setAttribute('data-english-filter-hidden', type);
    element.removeAttribute('data-english-filter-temp-hidden');
    this.updateStats(type);
  }

  updateStats(type) {
    chrome.storage.local.get(['filterStats'], result => {
      const stats = result.filterStats || { videos: 0, comments: 0, channels: 0 };
      stats[type + 's'] = (stats[type + 's'] || 0) + 1;
      chrome.storage.local.set({ filterStats: stats });
    });
  }

  showHiddenContent() {
    document.querySelectorAll('[data-english-filter-hidden], [data-english-filter-temp-hidden]').forEach(el => {
      this.showElement(el);
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    chrome.storage.sync.set({ enabled: this.enabled });
    
    if (this.enabled) {
      this.filterContent();
    } else {
      this.showHiddenContent();
    }
    return this.enabled;
  }

  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
    chrome.storage.sync.set(newSettings);
    
    if (this.enabled) {
      this.showHiddenContent();
      setTimeout(() => this.filterContent(), 100);
    }
  }
}

// Initialize
const filter = new YouTubeEnglishFilter();

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'toggle':
      sendResponse({ enabled: filter.toggle() });
      break;
    case 'updateSettings':
      filter.updateSettings(request.settings);
      sendResponse({ success: true });
      break;
    case 'getStatus':
      sendResponse({ 
        enabled: filter.enabled,
        settings: filter.settings
      });
      break;
  }
});