window.TitleService = {
  originalFetch: null,

  init() {
    this.disableTranslationSystem();
    this.blockTranslationRequests();
  },

  disableTranslationSystem() {
    try {
      if (window.yt && window.yt.config_) {
        if (window.yt.config_.EXPERIMENT_FLAGS) {
          window.yt.config_.EXPERIMENT_FLAGS.enable_video_title_translation = false;
          window.yt.config_.EXPERIMENT_FLAGS.enable_auto_translate = false;
        }
      }

      try {
        localStorage.removeItem('yt-player-translation-prefs');
        localStorage.removeItem('yt-translate');
      } catch (e) {}
    } catch (error) {
      console.warn('Error disabling translation system:', error);
    }
  },

  blockTranslationRequests() {
    if (this.originalFetch) return;
    
    this.originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (typeof url === 'string' && url.includes('translate')) {
        console.log('Blocked translation request:', url);
        return Promise.reject(new Error('Translation blocked'));
      }
      return this.originalFetch.apply(window, args);
    };
  },

  restoreOriginalTitles() {
    // Ana video sayfası
    if (window.location.href.includes('/watch?')) {
      this.restoreCurrentVideoTitle();
    }
    
    // Video listeleri
    this.restoreVideoListTitles();
  },

  restoreCurrentVideoTitle() {
    try {
      const methods = [
        () => this.getTitleFromMetadata(),
        () => this.getTitleFromPlayerAPI(),
        () => this.getTitleFromDOM()
      ];

      for (const method of methods) {
        const result = method();
        if (result && result.title) {
          this.applyOriginalTitle(result.title);
          break;
        }
      }
    } catch (error) {
      console.warn('Error restoring current video title:', error);
    }
  },

  getTitleFromMetadata() {
    try {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      const metaTitle = document.querySelector('title');
      
      let title = null;
      if (ogTitle) title = ogTitle.getAttribute('content');
      else if (twitterTitle) title = twitterTitle.getAttribute('content');
      else if (metaTitle) title = metaTitle.textContent;
      
      if (title && title.includes(' - YouTube')) {
        title = title.replace(' - YouTube', '');
      }
      
      return title ? { title } : null;
    } catch (error) {
      return null;
    }
  },

  getTitleFromPlayerAPI() {
    try {
      if (window.ytInitialPlayerResponse?.videoDetails?.title) {
        return {
          title: window.ytInitialPlayerResponse.videoDetails.title
        };
      }
    } catch (error) {
      return null;
    }
  },

  getTitleFromDOM() {
    try {
      const titleSelectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1.title.ytd-video-primary-info-renderer',
        '.ytd-video-primary-info-renderer h1',
        'yt-formatted-string.ytd-video-primary-info-renderer'
      ];

      for (const selector of titleSelectors) {
        const h1Title = document.querySelector(selector);
        if (h1Title && h1Title.textContent) {
          return { title: h1Title.textContent.trim() };
        }
      }
    } catch (error) {
      return null;
    }
  },

  applyOriginalTitle(title) {
    try {
      const titleSelectors = [
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1.title.ytd-video-primary-info-renderer',
        '.ytd-video-primary-info-renderer h1',
        'yt-formatted-string.ytd-video-primary-info-renderer',
        'ytd-video-primary-info-renderer h1 yt-formatted-string'
      ];

      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent !== title) {
          element.textContent = title;
          element.setAttribute('title', title);
          console.log('Title restored:', title);
          break;
        }
      }

      // Meta tag'leri güncelle
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      
      const pageTitle = document.querySelector('title');
      if (pageTitle) pageTitle.textContent = title + ' - YouTube';
    } catch (error) {
      console.warn('Error applying original title:', error);
    }
  },

  restoreVideoListTitles() {
    const videoElements = window.DOMService.getAllElements('video');
    videoElements.forEach(video => this.restoreVideoElementTitle(video));
  },

  restoreVideoElementTitle(videoElement) {
    try {
      const titleElement = videoElement.querySelector('#video-title, h3 a, .ytd-video-meta-block #video-title');
      if (!titleElement) return;

      let originalTitle = null;

      if (titleElement.hasAttribute('title') && titleElement.title !== titleElement.textContent.trim()) {
        originalTitle = titleElement.title;
      }

      if (!originalTitle && titleElement.hasAttribute('aria-label')) {
        originalTitle = titleElement.getAttribute('aria-label');
      }

      if (originalTitle && originalTitle !== titleElement.textContent.trim()) {
        titleElement.textContent = originalTitle;
        titleElement.setAttribute('title', originalTitle);
      }
    } catch (error) {
      console.warn('Error restoring video element title:', error);
    }
  },

  cleanup() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
};
