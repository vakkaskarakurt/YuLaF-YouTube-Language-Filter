window.FilterService = {
  async filterContent(settings) {
    if (!settings) return;

    const tasks = [];

    if (settings.hideVideos) {
      tasks.push(this.filterElementType('video'));
    }

    if (settings.hideChannels) {
      tasks.push(this.filterElementType('channel'));
    }

    await Promise.all(tasks);
  },

  async filterElementType(type) {
    const elements = window.DOMService.getAllElements(type);
    await Promise.all(elements.map(el => this.processElement(el, type)));
  },

  async processElement(element, type) {
    const currentLang = window.LanguageService.currentLanguage;
    const lastCheckedLang = element.getAttribute('data-language-filter-lang');

    // Eğer zaten aynı dil için kontrol edilmişse tekrar etme
    if (element.hasAttribute('data-language-filter-checked') && lastCheckedLang === currentLang) {
      return;
    }

    element.setAttribute('data-language-filter-checked', 'true');
    element.setAttribute('data-language-filter-lang', currentLang);

    // Önce gizle
    window.DOMService.hideElement(element, type);

    const text = window.DOMService.extractText(element, type).trim();

    if (text) {
      const isTarget = await window.LanguageService.detectLanguage(text);
      if (isTarget) {
        window.DOMService.showElement(element);
      }
    } else {
      // Hiç text yoksa direkt göster
      window.DOMService.showElement(element);
    }
  },

  processNewNode(node, settings) {
    if (!node.matches || !settings) return;

    // Reklamları atla
    if (
      node.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') ||
      node.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')
    ) {
      return;
    }

    const { video: videoSelectors, channel: channelSelectors } = window.YT_FILTER_CONFIG.selectors;

    // Tekil node video ise
    if (settings.hideVideos && videoSelectors.some(sel => node.matches(sel))) {
      this.processElement(node, 'video');
    }

    // Tekil node kanal ise
    if (settings.hideChannels && channelSelectors.some(sel => node.matches(sel))) {
      this.processElement(node, 'channel');
    }

    // Node’un içinde video veya kanal arayalım
    if (node.querySelectorAll) {
      if (settings.hideVideos) {
        node.querySelectorAll(videoSelectors.join(',')).forEach(video => {
          if (
            !video.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') &&
            !video.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')
          ) {
            this.processElement(video, 'video');
          }
        });
      }

      if (settings.hideChannels) {
        node.querySelectorAll(channelSelectors.join(',')).forEach(channel => {
          this.processElement(channel, 'channel');
        });
      }
    }
  }
};
