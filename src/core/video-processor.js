class VideoProcessor {
  constructor(languageDetector) {
    this.languageDetector = languageDetector;
    this.processedVideos = new Set(); // Artık uniqueId'ler saklanacak
    this.processingQueue = new Set(); // Artık uniqueId'ler saklanacak
    
    this.stats = {
      totalProcessed: 0,
      englishVideos: 0,
      filteredVideos: 0,
      processingErrors: 0
    };
    
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      const visibleVideos = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => entry.target)
        .filter(element => {
          const uniqueId = this.getUniqueVideoId(element);
          return !this.processedVideos.has(uniqueId);
        });
      
      if (visibleVideos.length > 0) {
        this.processBatch(visibleVideos);
      }
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });
  }

  observeNewVideos() {
    const unprocessedVideos = this.getVideoElements();
    unprocessedVideos.forEach(video => {
      this.intersectionObserver.observe(video);
    });
    console.log(`👁️ Observing ${unprocessedVideos.length} new videos`);
  }

  processBatch(videoElements, context = 'unknown') {
    console.log(`⚡ Fast batch processing: ${videoElements.length} videos`);
    
    videoElements.forEach(element => {
      const uniqueId = this.getUniqueVideoId(element);
      if (!this.processedVideos.has(uniqueId)) {
        element.classList.add('yef-processing');
      }
    });
    
    this.processBatchAsync(videoElements, context);
  }

  async processBatchAsync(videoElements, context) {
    const promises = videoElements.map(element => 
      this.processVideoFast(element, context)
    );
    
    await Promise.allSettled(promises);
    console.log(`✅ Batch completed: ${videoElements.length} videos`);
  }

  async processVideoFast(videoElement, context = 'unknown') {
    // 🆕 STRONGER duplicate check with unique ID
    const uniqueId = this.getUniqueVideoId(videoElement);
    if (!videoElement || this.processedVideos.has(uniqueId) || this.processingQueue.has(uniqueId)) {
      return;
    }

    this.processingQueue.add(uniqueId);
    
    try {
      const videoData = this.extractVideoData(videoElement);
      
      if (!videoData || !videoData.title) {
        this.hideVideoInstant(videoElement, 'unknown');
        this.markVideoAsProcessed(videoElement, uniqueId, 'unknown');
        this.stats.processingErrors++;
        return;
      }

      videoElement.classList.add('yef-processing');
      
      const language = await this.languageDetector.detectLanguage(videoData.title, context);
      
      if (language === 'en') {
        this.showVideoInstant(videoElement, language);
        this.stats.englishVideos++;
        console.log(`✅ SHOW: "${videoData.title.substring(0, 50)}..." (${videoData.type})`);
      } else {
        this.hideVideoInstant(videoElement, language);
        this.stats.filteredVideos++;
        console.log(`❌ HIDE: "${videoData.title.substring(0, 50)}..." (${videoData.type}) - ${language}`);
      }
      
      this.markVideoAsProcessed(videoElement, uniqueId, language);
      this.stats.totalProcessed++;
      
    } catch (error) {
      console.error('❌ Fast processing error:', error);
      this.hideVideoInstant(videoElement, 'error');
      this.markVideoAsProcessed(videoElement, uniqueId, 'error');
      this.stats.processingErrors++;
    } finally {
      this.processingQueue.delete(uniqueId);
      videoElement.classList.remove('yef-processing');
    }
  }

  // 🆕 Unique ID generator
  getUniqueVideoId(videoElement) {
    // Video URL'den unique ID çıkar
    const linkElement = videoElement.querySelector('a[href*="/watch"]');
    if (linkElement) {
      const url = linkElement.href;
      const videoId = url.match(/[?&]v=([^&]+)/);
      if (videoId) return videoId[1];
    }
    
    // Fallback: title + position based ID
    const titleElement = videoElement.querySelector('[title]');
    const title = titleElement ? titleElement.textContent : '';
    const rect = videoElement.getBoundingClientRect();
    
    return `${title.substring(0, 20)}_${Math.round(rect.top)}_${Math.round(rect.left)}`;
  }

  getVideoElements() {
    const selectors = [
      'ytd-video-renderer',
      'ytd-rich-item-renderer',
      'ytd-grid-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-movie-renderer',
      'ytd-playlist-renderer',
      'ytd-radio-renderer',
      'yt-lockup-view-model',
      'ytd-channel-renderer'
    ];
    
    const elements = [];
    selectors.forEach(selector => {
      const found = document.querySelectorAll(selector);
      elements.push(...Array.from(found));
    });
    
    return elements.filter(el => {
      if (!el) return false;
      const uniqueId = this.getUniqueVideoId(el);
      return !this.processedVideos.has(uniqueId);
    });
  }

  extractVideoData(videoElement) {
    const contentType = this.getContentType(videoElement);
    
    if (videoElement.tagName === 'YTD-CHANNEL-RENDERER') {
      return this.extractChannelData(videoElement);
    }
    
    const titleSelectors = [
      'yt-formatted-string[id="video-title"]',
      'yt-formatted-string#video-title',
      '[title]',
      '#video-title',
      'a#video-title',
      'h3 a[href*="/watch"]',
      'a[href*="/watch"] h3',
      'h3',
      '#video-title-link',
      'span[dir="auto"]',
      'a[href*="/shorts/"]',
      'a[href*="/playlist"] h3'
    ];
    
    let title = '';
    for (const selector of titleSelectors) {
      const element = videoElement.querySelector(selector);
      if (element) {
        title = element.textContent?.trim() || 
                element.getAttribute('title')?.trim() || '';
        
        if (title && title.length > 2) {
          break;
        }
      }
    }
    
    if (title) {
      title = this.cleanTitle(title);
    }
    
    return title && title.length > 3 ? { title, type: contentType } : null;
  }

  extractChannelData(channelElement) {
    const channelSelectors = [
      'ytd-channel-name a',
      '#text',
      '#channel-title',
      'yt-formatted-string',
      'a[href*="/channel/"]',
      'a[href*="/@"]'
    ];
    
    for (const selector of channelSelectors) {
      const element = channelElement.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 2) {
          return { title: text, type: 'CHANNEL' };
        }
      }
    }
    
    return null;
  }

  getContentType(videoElement) {
    if (videoElement.tagName === 'YTD-CHANNEL-RENDERER') {
      return 'CHANNEL';
    }
    
    if (videoElement.querySelector('a[href*="/shorts/"]')) {
      return 'SHORTS';
    }
    
    if (videoElement.querySelector('a[href*="/playlist"]') || 
        videoElement.tagName === 'YTD-PLAYLIST-RENDERER') {
      return 'PLAYLIST';
    }
    
    if (videoElement.tagName === 'YTD-MOVIE-RENDERER') {
      return 'MOVIE';
    }
    
    return 'VIDEO';
  }

  cleanTitle(title) {
    return title
      .replace(/^\s*\d+\.\s*/, '')
      .replace(/\s+/g, ' ')
      .replace(/[|•·]/g, ' ')
      .trim();
  }

  // 🆕 SIMPLIFIED - No transition manipulation
  hideVideoInstant(videoElement, language = 'non-en') {
    videoElement.classList.remove('yef-english', 'yef-processing');
    videoElement.classList.add('yef-hidden');
    videoElement.setAttribute('data-filtered', 'true');
    videoElement.setAttribute('data-language', language);
  }

  // 🆕 SIMPLIFIED - No transition manipulation
  showVideoInstant(videoElement, language = 'en') {
    videoElement.classList.remove('yef-hidden', 'yef-processing');
    videoElement.classList.add('yef-english');
    videoElement.removeAttribute('data-filtered');
    videoElement.setAttribute('data-language', language);
  }

  // 🆕 Updated markVideoAsProcessed
  markVideoAsProcessed(videoElement, uniqueId, language) {
    this.processedVideos.add(uniqueId);  // Element yerine uniqueId sakla
    videoElement.setAttribute('data-processed', 'true');
    videoElement.setAttribute('data-video-id', uniqueId);  // ID'yi element'e de yaz
    videoElement.setAttribute('data-language', language);
    videoElement.setAttribute('data-processed-time', Date.now().toString());
  }

  async reprocessAllVideos(isEnabled) {
    console.log(`🔄 Fast reprocessing (filter ${isEnabled ? 'ON' : 'OFF'})`);
    
    if (isEnabled) {
      document.body.classList.remove('yef-filter-disabled');
      this.processedVideos.clear();
      this.observeNewVideos();
    } else {
      document.body.classList.add('yef-filter-disabled');
    }
  }

  getStats() {
    return {
      ...this.stats,
      processedCount: this.processedVideos.size,
      queueSize: this.processingQueue.size,
      filterRate: this.stats.totalProcessed > 0 ? 
        (this.stats.filteredVideos / this.stats.totalProcessed * 100).toFixed(1) + '%' : '0%'
    };
  }

  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.processedVideos.clear();
    this.processingQueue.clear();
    this.stats = {
      totalProcessed: 0,
      englishVideos: 0,
      filteredVideos: 0,
      processingErrors: 0
    };
  }
}