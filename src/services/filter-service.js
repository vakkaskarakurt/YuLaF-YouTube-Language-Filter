window.FilterService = {
  async filterContent(settings) {
    if (!settings) return;

    const filterPromises = [];

    if (settings.hideVideos) {
      filterPromises.push(this.filterElementType('video'));
    }
    
    if (settings.hideChannels) {
      filterPromises.push(this.filterElementType('channel'));
    }

    await Promise.all(filterPromises);
  },

  async filterElementType(type) {
    const elements = window.DOMService.getAllElements(type);
    const processPromises = elements.map(element => this.processElement(element, type));
    await Promise.all(processPromises);
  },

  async processElement(element, type) {
    // Eğer daha önce işlendiyse ve dil değişmemişse geç
    const currentLang = window.LanguageService.currentLanguage;
    const lastCheckedLang = element.getAttribute('data-language-filter-lang');
    
    if (element.hasAttribute('data-language-filter-checked') && lastCheckedLang === currentLang) {
      return;
    }
    
    element.setAttribute('data-language-filter-checked', 'true');
    element.setAttribute('data-language-filter-lang', currentLang);

    // Önce gizle
    window.DOMService.hideElement(element, type);

    const text = window.DOMService.extractText(element, type);
    
    if (text.trim()) {
      const isTargetLanguage = await window.LanguageService.detectLanguage(text.trim());
      if (isTargetLanguage) {
        window.DOMService.showElement(element);
      }
    } else {
      window.DOMService.showElement(element);
    }
  },

  processNewNode(node, settings) {
    if (!node.matches || !settings) return;

    const isAd = node.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') ||
                 node.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer');
    
    if (isAd) return;

    const videoSelectors = window.YT_FILTER_CONFIG.selectors.video;
    if (settings.hideVideos && videoSelectors.some(selector => node.matches(selector))) {
      this.processElement(node, 'video');
    }

    const channelSelectors = window.YT_FILTER_CONFIG.selectors.channel;
    if (settings.hideChannels && channelSelectors.some(selector => node.matches(selector))) {
      this.processElement(node, 'channel');
    }

    if (node.querySelectorAll) {
      if (settings.hideVideos) {
        const innerVideos = node.querySelectorAll(videoSelectors.join(','));
        innerVideos.forEach(video => {
          if (!video.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') && 
              !video.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) {
            this.processElement(video, 'video');
          }
        });
      }
      
      if (settings.hideChannels) {
        const innerChannels = node.querySelectorAll(channelSelectors.join(','));
        innerChannels.forEach(channel => this.processElement(channel, 'channel'));
      }
    }
  }
};