class VideoProcessor {
  constructor(languageDetector) {
    this.languageDetector = languageDetector;
    this.processedVideos = new Set();
    this.filteredVideos = []; // 🆕 Filtrelenen videoları toplama listesi
    this.maxListSize = 50; // Maksimum liste boyutu
    this.naturalProcessQueue = []; // 🆕 Natural işlem kuyruğu
  }

  getVideoElements() {
    // Sadece gerçek video içeriği olan selektörler
    const selectors = [
      // Ana video content selektörleri
      'ytd-video-renderer',          // ✅ Arama sonuçları (17 element)
      'ytd-rich-item-renderer',      // Ana sayfa videoları
      'ytd-grid-video-renderer',     // Grid görünümü
      'ytd-compact-video-renderer',  // Kompakt görünüm
      'ytd-movie-renderer',          // Film içerikleri
      'ytd-playlist-renderer',       // Playlist'ler
      'ytd-radio-renderer',          // Mix'ler
      'ytd-rich-grid-media',        // Shorts grid
      'yt-lockup-view-model',      // hem shorts hem playlist 

      'ytd-rich-section-renderer',   // Shorts containers
      'ytm-shorts-lockup-view-model-v2', // Shorts containers
      
      // İçerik türleri
      'ytd-channel-renderer'         // ✅ Kanal sonuçları (1 element)
      
    ];
    
    let videos = [];
    for (const selector of selectors) {
      const found = Array.from(document.querySelectorAll(selector));
      if (found.length > 0) {
        console.log(`📋 Found ${found.length} ${selector} elements`);
        videos = videos.concat(found);
      }
    }
    
    // Reklam elementlerini filtrele
    videos = videos.filter(video => !this.isStrictAdElement(video));
    
    videos = [...new Set(videos)];
    console.log(`🎬 Found ${videos.length} total video elements`);
    return videos;
  }

  // Daha spesifik ad filter
  isStrictAdElement(element) {
    // Sadece kesin reklam elementlerini filtrele
    const strictAdSelectors = [
      'ytd-ad-slot-renderer',
      'ytd-in-feed-ad-layout-renderer'
    ];
    
    return strictAdSelectors.some(selector => 
      element.matches(selector) || element.closest(selector)
    );
  }

  isAdElement(element) {
    const adSelectors = [
      'ytd-ad-slot-renderer',
      'ytd-in-feed-ad-layout-renderer',
      '[data-is-ad="true"]'
    ];
    
    return adSelectors.some(selector => 
      element.matches(selector) || 
      element.closest(selector) ||
      element.querySelector(selector)
    );
  }

  // 🆕 Filtrelenen video ekle
  addToFilteredList(videoData) {
    const item = {
      title: videoData.title,
      language: videoData.language,
      type: videoData.type || 'VIDEO',
      timestamp: new Date().toLocaleTimeString(),
      url: videoData.url || null,
      element: videoData.element || null, // 🆕 DOM elementi referansı
      channelName: videoData.channelName || null // 🆕 Kanal adı
    };
    
    // Listeye ekle (en yeniler üstte)
    this.filteredVideos.unshift(item);
    
    // Maksimum boyutu aş
    if (this.filteredVideos.length > this.maxListSize) {
      this.filteredVideos = this.filteredVideos.slice(0, this.maxListSize);
    }
    
    // Console'da göster (mevcut davranış)
    console.log(`🚫 Filtered: [${videoData.language}] ${videoData.title}`);
    
    // Storage'a kaydet
    this.saveFilteredVideos();
  }

  // 🆕 Storage'a filtrelenen videoları kaydet
  async saveFilteredVideos() {
    try {
      await chrome.storage.local.set({
        'filteredVideos': this.filteredVideos,
        'lastUpdate': Date.now()
      });
    } catch (error) {
      console.error('Error saving filtered videos:', error);
    }
  }

  // 🆕 Filtrelenen videoları temizle
  async clearFilteredVideos() {
    this.filteredVideos = [];
    await this.saveFilteredVideos();
  }

  // 🆕 Video URL'sini çıkar
  extractVideoUrl(videoElement) {
    const linkSelectors = [
      'a[href*="/watch"]',
      'a[href*="/shorts/"]', 
      'a[href*="/playlist"]',
      'a[href*="/channel/"]',
      'a[href*="/@"]'
    ];
    
    for (const selector of linkSelectors) {
      const link = videoElement.querySelector(selector);
      if (link && link.href) {
        return link.href;
      }
    }
    return null;
  }

  // 🆕 Video elementinden kanal adını çıkar
  extractChannelName(videoElement) {
    const channelSelectors = [
      'ytd-channel-name a',
      '#channel-name a',
      '.ytd-channel-name a',
      '[id="channel-name"] a',
      'a[href*="/channel/"]',
      'a[href*="/@"]',
      '.yt-simple-endpoint.style-scope.yt-formatted-string'
    ];
    
    for (const selector of channelSelectors) {
      const element = videoElement.querySelector(selector);
      if (element && element.textContent && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }
    return null;
  }

  async processVideo(videoElement, isEnabled) {
    if (this.processedVideos.has(videoElement)) return;
    
    this.processedVideos.add(videoElement);
    
    // Reklam kontrolü
    if (this.isAdElement(videoElement)) {
      videoElement.style.display = 'none';
      return;
    }

    // ✨ Hiç görünmeme garantisi
    videoElement.classList.add('yef-processing');
    
    const videoData = this.extractVideoData(videoElement);
    
    if (videoData && videoData.title) {
      const language = await this.languageDetector.detectLanguage(videoData.title);
      const url = this.extractVideoUrl(videoElement);
      const channelName = this.extractChannelName(videoElement);
      
      // ⚡ Anında karar ver ve göster/gizle
      if (isEnabled && language !== 'en') {
        this.hideVideo(videoElement, language);
        
        // 🆕 Element referansı da ekle
        this.addToFilteredList({
          title: videoData.title,
          language: language,
          type: videoData.type,
          url: url,
          element: videoElement,
          channelName: channelName
        });
      } else {
        this.showVideo(videoElement, language);
      }
      
      this.markVideoAsProcessed(videoElement, language);
    } else {
      // Başlık yoksa gizle
      this.hideVideo(videoElement, 'unknown');
      this.markVideoAsProcessed(videoElement, 'unknown');
    }
  }

  extractVideoData(videoElement) {
    const contentType = this.getContentType(videoElement);
    
    // Kanal sonuçları için özel handling
    if (videoElement.tagName === 'YTD-CHANNEL-RENDERER') {
      return this.extractChannelData(videoElement);
    }
    
    // 🆕 YENİ: yt-formatted-string prioritesi ile
    const titleSelectors = [
      'yt-formatted-string[id="video-title"]',  // 🆕 En spesifik
      'yt-formatted-string#video-title',        // 🆕 Alternatif yazım
      '[title]',                                // ✅ Çalışıyor
      '#video-title',                           // ✅ Çalışıyor  
      'a#video-title',                          // ✅ Çalışıyor
      'h3',                          
      '#video-title-link',
      'h3 a[href*="/watch"]',
      'a[href*="/watch"] h3',
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
          console.log(`📝 Title found with selector: ${selector} -> "${title.substring(0, 50)}..."`);
          break;
        }
      }
    }
    
    if (title) {
      title = this.cleanTitle(title);
    }
    
    return title && title.length > 3 ? { title, type: contentType } : null;
  }

  // Yeni metod ekle
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
          console.log(`📝 Channel title found: "${text}"`);
          return { title: text, type: 'CHANNEL' };
        }
      }
    }
    
    return null;
  }

  getContentType(videoElement) {
    // Kanal kontrolü ekle
    if (videoElement.tagName === 'YTD-CHANNEL-RENDERER') {
      return 'CHANNEL';
    }
    
    // Shorts kontrolü
    if (videoElement.querySelector('a[href*="/shorts/"]')) {
      return 'SHORTS';
    }
    
    // Playlist kontrolü
    if (videoElement.querySelector('a[href*="/playlist"]') || 
        videoElement.tagName === 'YTD-PLAYLIST-RENDERER' ||
        videoElement.tagName === 'YTD-RADIO-RENDERER') {
      return 'PLAYLIST';
    }
    
    // Mix kontrolü
    if (videoElement.querySelector('a[href*="/watch"][href*="&list="]')) {
      return 'MIX';
    }
    
    return 'VIDEO';
  }

  cleanTitle(title) {
    // Zaman damgalarını temizle
    title = title.replace(/\s*\(\d+:\d+\)\s*/g, '').trim();
    
    // Fazla boşlukları temizle
    title = title.replace(/\s+/g, ' ').trim();
    
    // YouTube artifacts temizle
    title = title.replace(/^(Mix – |Mix - )/i, '').trim();
    title = title.replace(/\s*\|\s*YouTube\s*$/i, '').trim();
    
    return title;
  }

  // ✨ YENİ: CSS class-based hide/show
  hideVideo(videoElement, language = 'non-en') {
    videoElement.classList.remove('yef-english', 'yef-processing');
    videoElement.classList.add('yef-hidden');
    videoElement.setAttribute('data-filtered', 'true');
    videoElement.setAttribute('data-language', language);
  }

  showVideo(videoElement, language = 'en') {
    videoElement.classList.remove('yef-hidden', 'yef-processing');
    videoElement.classList.add('yef-english');
    videoElement.removeAttribute('data-filtered');
    videoElement.setAttribute('data-language', language);
  }

  markVideoAsProcessed(videoElement, language) {
    videoElement.setAttribute('data-processed', 'true');
    videoElement.setAttribute('data-language', language);
  }

  // ✨ YENİ: Geliştirilmiş reprocess
  reprocessAllVideos(isEnabled) {
    // Body'ye filter durumunu ekle
    if (isEnabled) {
      document.body.classList.remove('yef-filter-disabled');
    } else {
      document.body.classList.add('yef-filter-disabled');
    }

    const videos = this.getVideoElements();
    videos.forEach(video => {
      const language = video.getAttribute('data-language');
      if (language) {
        if (isEnabled && language !== 'en' && language !== 'unknown') {
          this.hideVideo(video, language);
        } else {
          this.showVideo(video, language);
        }
      }
    });
  }

  // 🆕 Video elementinin tipini ve yapısını analiz et (Shorts destekli)
  analyzeVideoElement(videoElement) {
    const analysis = {
      tagName: videoElement.tagName,
      classes: Array.from(videoElement.classList),
      location: this.getPageLocation(),
      hasMenuButton: false,
      menuButtonSelectors: [],
      videoType: this.getContentType(videoElement)
    };
    
    // Video tipi bazında farklı menü buton kontrolü
    let menuSelectors = [];
    
    if (analysis.videoType === 'SHORTS') {
      // Shorts için özel selector'lar
      menuSelectors = [
        'yt-icon-button[aria-label*="More"]',
        'button[aria-label*="More actions"]', 
        'button[aria-label*="Actions"]',
        '.ytd-shorts-video-actions button[aria-label*="More"]',
        '.ytd-reel-video-renderer button[aria-label*="More"]',
        'ytd-shorts-player-controls button[aria-label*="More"]',
        '.shorts-video-actions button',
        '.ytd-shorts-video-actions yt-icon-button'
      ];
    } else {
      // Normal videolar için mevcut selector'lar
      menuSelectors = [
        'button[aria-label*="menu"]',
        'button[aria-label*="Menu"]', 
        'button[aria-label*="More"]',
        'button[aria-label*="more"]',
        'button[aria-label*="Action"]',
        'button[aria-label*="Options"]',
        'yt-icon-button[aria-label*="More"]',
        'ytd-menu-renderer button',
        '#button[aria-label*="More"]',
        '.ytd-menu-renderer button',
        '[role="button"][aria-label*="More"]'
      ];
    }
    
    for (const selector of menuSelectors) {
      const button = videoElement.querySelector(selector);
      if (button) {
        analysis.hasMenuButton = true;
        analysis.menuButtonSelectors.push({
          selector,
          ariaLabel: button.getAttribute('aria-label'),
          classes: Array.from(button.classList)
        });
      }
    }
    
    // Shorts için parent container'larda da ara
    if (analysis.videoType === 'SHORTS' && !analysis.hasMenuButton) {
      const parentContainers = [
        videoElement.closest('ytd-reel-video-renderer'),
        videoElement.closest('.ytd-shorts-video'),
        videoElement.closest('#shorts-container')
      ];
      
      for (const container of parentContainers) {
        if (container) {
          for (const selector of menuSelectors) {
            const button = container.querySelector(selector);
            if (button) {
              analysis.hasMenuButton = true;
              analysis.menuButtonSelectors.push({
                selector: `parent: ${selector}`,
                ariaLabel: button.getAttribute('aria-label'),
                classes: Array.from(button.classList)
              });
              break;
            }
          }
          if (analysis.hasMenuButton) break;
        }
      }
    }
    
    return analysis;
  }

  // 🆕 Sayfa lokasyonunu tespit et
  getPageLocation() {
    const url = window.location.href;
    if (url.includes('/results?')) return 'search';
    if (url.includes('/watch?')) return 'watch';
    if (url.includes('/channel/') || url.includes('/@')) return 'channel';
    if (url.includes('/shorts/')) return 'shorts';
    if (url === 'https://www.youtube.com/' || url.includes('/feed/')) return 'home';
    return 'unknown';
  }

  // 🆕 Shorts için özel menü butonu bulma
  async findMenuButtonForShorts(videoElement) {
    console.log('🩳 Shorts video detected, using special selectors...');
    const shortsMenuSelectors = [
      'yt-icon-button[aria-label*="More"]',
      'button[aria-label*="More actions"]',
      'button[aria-label*="Actions"]',
      '.ytd-shorts-video-actions button[aria-label*="More"]',
      '.ytd-reel-video-renderer button[aria-label*="More"]',
      'ytd-shorts-player-controls button[aria-label*="More"]',
      '.shorts-video-actions button',
      '.ytd-shorts-video-actions yt-icon-button',
      '#shorts-container button[aria-label*="More"]',
      '.reel-video-in-sequence button[aria-label*="More"]',
      'ytd-reel-video-renderer yt-icon-button',
      '.ytd-reel-video-renderer button[role="button"]',
      // Ek alternatifler
      'button[aria-label*="Diğer"]',
      'button[aria-label*="Menü"]',
      'button[aria-label*="Seçenekler"]',
      '.ytd-shorts-video-actions button',
      '.ytd-shorts-video-actions yt-icon-button',
      '.ytd-reel-video-renderer button',
      '.ytd-reel-video-renderer yt-icon-button',
    ];
    // Retry ve bekleme ile menü bulma
    for (let attempt = 0; attempt < 3; attempt++) {
      for (const selector of shortsMenuSelectors) {
        const button = videoElement.querySelector(selector);
        if (button) {
          console.log(`✅ Shorts menu button found: ${selector} (${button.getAttribute('aria-label')}) [attempt ${attempt+1}]`);
          return button;
        }
      }
      // Parent container'larda da ara
      const parentContainers = [
        videoElement.closest('ytd-reel-video-renderer'),
        videoElement.closest('.ytd-shorts-video'),
        videoElement.closest('#shorts-container'),
        videoElement.closest('.shorts-video-container')
      ];
      for (const container of parentContainers) {
        if (container) {
          for (const selector of shortsMenuSelectors) {
            const button = container.querySelector(selector);
            if (button) {
              console.log(`✅ Shorts menu button found in parent: ${selector} [attempt ${attempt+1}]`);
              return button;
            }
          }
        }
      }
      // Bulamazsa bekle ve tekrar dene
      await this.delay(800);
    }
    console.log('❌ No Shorts menu button found after retries');
    return null;
  }

  // 🆕 Geliştirilmiş menü butonu bulma (Shorts destekli)
  async findMenuButton(videoElement) {
    const analysis = this.analyzeVideoElement(videoElement);
    console.log('🔍 Video Analysis:', analysis);
    
    // Eğer Shorts ise özel metod kullan
    if (analysis.videoType === 'SHORTS') {
      return await this.findMenuButtonForShorts(videoElement);
    }
    
    // Normal videolar için mevcut kod
    const location = analysis.location;
    let selectors = [];
    
    if (location === 'home') {
      selectors = [
        'ytd-menu-renderer button',
        'yt-icon-button[aria-label*="More"]',
        'button[aria-label*="More actions"]',
        '#button[aria-label*="More"]'
      ];
    } else if (location === 'search') {
      selectors = [
        'button[aria-label*="More"]',
        'button[aria-label*="menu"]',
        'ytd-menu-renderer button',
        '.ytd-menu-renderer button'
      ];
    } else {
      // Genel selectors
      selectors = [
        'button[aria-label*="More"]',
        'button[aria-label*="menu"]',
        'button[aria-label*="Menu"]',
        'button[aria-label*="Action"]',
        'yt-icon-button[aria-label*="More"]',
        'ytd-menu-renderer button',
        '[role="button"][aria-label*="More"]'
      ];
    }
    
    for (const selector of selectors) {
      const button = videoElement.querySelector(selector);
      if (button) {
        console.log(`✅ Menu button found: ${selector} (${button.getAttribute('aria-label')})`);
        return button;
      }
    }
    
    console.log('❌ No menu button found for:', analysis);
    return null;
  }

  // 🆕 Shorts için özel scroll ve visibility check
  async ensureShortsVisibility(videoElement) {
    // Shorts videoları için özel görünürlük kontrolü
    const shortsContainer = videoElement.closest('ytd-reel-video-renderer') || 
                           videoElement.closest('.ytd-shorts-video') ||
                           videoElement.closest('#shorts-container');
    
    if (shortsContainer) {
      // Shorts container'ını merkeze getir
      shortsContainer.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center' 
      });
      
      await this.delay(1000);
      
      // Shorts'un aktif olduğundan emin ol
      const isActive = shortsContainer.querySelector('.html5-video-player video');
      if (isActive) {
        console.log('🩳 Shorts video is now active and visible');
        return true;
      }
    }
    
    return false;
  }

  // 🆕 Shorts için özel Natural işlemler
  async performNotInterestedForShorts(videoElement) {
    try {
      console.log('🩳 Performing "Not interested" for Shorts...');
      
      // Shorts görünürlüğünü sağla
      await this.ensureShortsVisibility(videoElement);
      
      const menuButton = await this.findMenuButtonForShorts(videoElement);
      
      if (!menuButton) {
        console.log('❌ Shorts menu button not found');
        return false;
      }
      
      menuButton.click();
      console.log('🔘 Shorts menu button clicked');
      
      // Shorts menüsü genellikle farklı yapıda olur
      try {
        await this.waitForElement('[role="menuitem"], .ytd-menu-service-item-renderer, [role="option"]', 4000);
      } catch (error) {
        console.log('❌ Shorts menu items not loaded');
        document.body.click();
        return false;
      }
      
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], .ytd-menu-service-item-renderer, .yt-dropdown-menu [role="button"]'));
      console.log('🔍 Shorts menu items:', menuItems.map(item => item.textContent.trim()));
      
      // Shorts için "Not interested" metinleri
      const notInterestedTexts = [
        'Not interested',
        'not interested', 
        'İlgilenmiyorum',
        'ilgilenmiyorum',
        "I'm not interested",
        'Hide this video',
        'Remove',
        'Hide'
      ];
      
      let notInterestedButton = null;
      for (const text of notInterestedTexts) {
        notInterestedButton = menuItems.find(item => 
          item.textContent.toLowerCase().includes(text.toLowerCase())
        );
        
        if (notInterestedButton) {
          console.log(`✅ Shorts "Not interested" found: "${text}"`);
          break;
        }
      }
      
      if (notInterestedButton) {
        notInterestedButton.click();
        console.log('✅ Shorts Not interested clicked successfully');
        await this.delay(500);
        return true;
      } else {
        console.log('❌ Shorts "Not interested" option not found');
        console.log('Available Shorts options:', menuItems.map(item => `"${item.textContent.trim()}"`));
        document.body.click();
        return false;
      }
      
    } catch (error) {
      console.error('❌ Shorts performNotInterested error:', error);
      try {
        document.body.click();
      } catch (e) {}
      return false;
    }
  }

  // 🆕 Geliştirilmiş Natural işlemler - İlgilenmiyorum (Shorts destekli)
  async performNotInterested(videoElement) {
    const analysis = this.analyzeVideoElement(videoElement);
    
    // Eğer Shorts ise özel metod kullan
    if (analysis.videoType === 'SHORTS') {
      return await this.performNotInterestedForShorts(videoElement);
    }
    
    // Normal videolar için mevcut kod
    try {
      const menuButton = await this.findMenuButton(videoElement);
      
      if (!menuButton) {
        console.log('❌ Menu button not found');
        return false;
      }
      
      // Scroll to element to ensure visibility
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.delay(500);
      
      menuButton.click();
      console.log('🔘 Menu button clicked');
      
      // Menü açılana kadar bekle - daha uzun timeout
      try {
        await this.waitForElement('[role="menuitem"]', 4000);
      } catch (error) {
        console.log('❌ Menu items not loaded, trying alternative selectors...');
        // Alternatif menü selectors
        const altSelectors = ['[role="menu"] [role="option"]', '.ytd-menu-service-item-renderer'];
        let found = false;
        for (const sel of altSelectors) {
          if (document.querySelector(sel)) {
            found = true;
            break;
          }
        }
        if (!found) {
          document.body.click(); // Menüyü kapat
          return false;
        }
      }
      
      // Mevcut menü öğelerini listele (debug için)
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], .ytd-menu-service-item-renderer'));
      console.log('🔍 Menu items found:', menuItems.map(item => item.textContent.trim()));
      
      // "İlgilenmiyorum" / "Not interested" seçeneğini bul
      const notInterestedTexts = [
        'Not interested',
        'not interested', 
        'İlgilenmiyorum',
        'ilgilenmiyorum',
        "I'm not interested",
        'Hide this video',
        'Remove from recommendations',
        'Don\'t show me this'
      ];
      
      let notInterestedButton = null;
      for (const text of notInterestedTexts) {
        notInterestedButton = menuItems.find(item => 
          item.textContent.toLowerCase().includes(text.toLowerCase())
        );
        
        if (notInterestedButton) {
          console.log(`✅ "Not interested" found: "${text}"`);
          break;
        }
      }
      
      if (notInterestedButton) {
        notInterestedButton.click();
        console.log('✅ Not interested clicked successfully');
        await this.delay(500);
        return true;
      } else {
        console.log('❌ "Not interested" option not found');
        console.log('Available options:', menuItems.map(item => `"${item.textContent.trim()}"`));
        document.body.click(); // Menüyü kapat
        return false;
      }
      
    } catch (error) {
      console.error('❌ performNotInterested error:', error);
      try {
        document.body.click(); // Menüyü kapat
      } catch (e) {}
      return false;
    }
  }

  // 🆕 Geliştirilmiş Natural işlemler - Bu kanalı önerme (Shorts destekli)
  async performDontRecommendChannel(videoElement) {
    const analysis = this.analyzeVideoElement(videoElement);
    
    // Shorts için özel işlem gerekebilir ama şimdilik normal metod kullanıyoruz
    try {
      const menuButton = await this.findMenuButton(videoElement);
      
      if (!menuButton) {
        console.log('❌ Menu button not found for channel action');
        return false;
      }
      
      menuButton.click();
      console.log('🔘 Menu button clicked for channel');
      
      try {
        await this.waitForElement('[role="menuitem"]', 4000);
      } catch (error) {
        console.log('❌ Menu items not loaded for channel action');
        document.body.click();
        return false;
      }
      
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], .ytd-menu-service-item-renderer'));
      console.log('🔍 Channel menu items:', menuItems.map(item => item.textContent.trim()));
      
      // "Bu kanalı önerme" / "Don't recommend channel" seçeneğini bul
      const dontRecommendTexts = [
        "Don't recommend channel",
        "don't recommend channel",
        "Don't recommend this channel",
        "Hide videos from this channel",
        'Bu kanalı önerme',
        'kanalı önerme',
        'Block channel',
        'Hide channel'
      ];
      
      let dontRecommendButton = null;
      for (const text of dontRecommendTexts) {
        dontRecommendButton = menuItems.find(item => 
          item.textContent.toLowerCase().includes(text.toLowerCase())
        );
        
        if (dontRecommendButton) {
          console.log(`✅ "Don't recommend channel" found: "${text}"`);
          break;
        }
      }
      
      if (dontRecommendButton) {
        dontRecommendButton.click();
        console.log('✅ Don\'t recommend channel clicked successfully');
        await this.delay(500);
        return true;
      } else {
        console.log('❌ "Don\'t recommend channel" option not found');
        console.log('Available channel options:', menuItems.map(item => `"${item.textContent.trim()}"`));
        document.body.click(); // Menüyü kapat
        return false;
      }
      
    } catch (error) {
      console.error('❌ performDontRecommendChannel error:', error);
      try {
        document.body.click();
      } catch (e) {}
      return false;
    }
  }

  // 🆕 Debug menü öğelerini listele (Sorun giderme için)
  async debugMenuItems(videoElement) {
    try {
      const menuButton = await this.findMenuButton(videoElement);
      if (menuButton) {
        menuButton.click();
        await this.waitForElement('[role="menuitem"]', 2000);
        
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], .ytd-menu-service-item-renderer'));
        console.log('🔍 Available menu items:');
        menuItems.forEach((item, index) => {
          console.log(`${index + 1}. "${item.textContent.trim()}"`);
        });
        
        // Menüyü kapat
        document.body.click();
      }
    } catch (error) {
      console.error('Debug menu error:', error);
    }
  }

  // 🆕 Natural işlemler ana metodu (Shorts destekli)
  async performNaturalActions(options = {}) {
    const { hideShorts } = options;
    const videos = this.getVideoElements();
    const filteredVideos = videos.filter(video => {
      const language = video.getAttribute('data-language');
      const analysis = this.analyzeVideoElement(video);
      if (hideShorts && analysis.videoType === 'SHORTS') return false;
      return language && language !== 'en' && language !== 'unknown';
    });
    let processedCount = 0;
    let errorCount = 0;
    let partialCount = 0;
    let shortsMenuYokCount = 0;
    let normalMenuYokCount = 0;
    let shortsMenuYokTitles = [];
    let normalMenuYokTitles = [];
    const totalVideos = filteredVideos.length;
    this.sendProgressUpdate(0, totalVideos, 'Video analizi yapılıyor...', {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
    if (totalVideos === 0) {
      this.sendProgressUpdate(0, 0, 'Filtrelenen video bulunamadı', {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
      return { processed: 0, errors: 0, partial: 0, shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles };
    }
    for (let i = 0; i < filteredVideos.length; i++) {
      const videoElement = filteredVideos[i];
      try {
        const videoData = this.extractVideoData(videoElement);
        const videoTitle = videoData?.title || 'Başlık bulunamadı';
        const analysis = this.analyzeVideoElement(videoElement);
        this.sendProgressUpdate(i, totalVideos, `Analiz: ${videoTitle.substring(0, 25)}...`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
        if (!analysis.hasMenuButton) {
          if (analysis.videoType === 'SHORTS') {
            shortsMenuYokCount++;
            shortsMenuYokTitles.push(videoTitle);
          } else {
            normalMenuYokCount++;
            normalMenuYokTitles.push(videoTitle);
          }
          this.sendProgressUpdate(i + 1, totalVideos, `❌ Menü yok: ${i + 1}/${totalVideos}`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
          continue;
        }
        const waitTime = analysis.videoType === 'SHORTS' ? 4000 : 3000;
        await this.delay(waitTime);
        this.sendProgressUpdate(i, totalVideos, `"Not interested" işleniyor...`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
        const notInterestedResult = await this.performNotInterested(videoElement);
        if (notInterestedResult) {
          await this.delay(1500);
          this.sendProgressUpdate(i, totalVideos, `"Don't recommend" işleniyor...`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
          const channelResult = await this.performDontRecommendChannel(videoElement);
          if (channelResult) {
            processedCount++;
            this.sendProgressUpdate(i + 1, totalVideos, `✅ Tam başarılı: ${processedCount}/${totalVideos}`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
          } else {
            partialCount++;
            this.sendProgressUpdate(i + 1, totalVideos, `⚠️ Kısmi başarılı: ${processedCount + partialCount}/${totalVideos}`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
          }
        } else {
          errorCount++;
          this.sendProgressUpdate(i + 1, totalVideos, `❌ Başarısız: ${errorCount}/${totalVideos}`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
        }
      } catch (error) {
        errorCount++;
        this.sendProgressUpdate(i + 1, totalVideos, `❌ Hata: ${error.message.substring(0, 20)}...`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
      }
      await this.delay(1000);
    }
    const successRate = Math.round(((processedCount + partialCount) / totalVideos) * 100);
    this.sendProgressUpdate(totalVideos, totalVideos, `🎉 Tamamlandı! %${successRate} başarı (${processedCount} tam, ${partialCount} kısmi, ${errorCount} hata)`, {shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles});
    return { processed: processedCount, errors: errorCount, partial: partialCount, shortsMenuYokCount, normalMenuYokCount, shortsMenuYokTitles, normalMenuYokTitles };
  }

  // 🆕 Progress mesajı gönderme metodu
  sendProgressUpdate(current, total, message, extraStats) {
    try {
      chrome.runtime.sendMessage({
        action: 'naturalProgress',
        current: current,
        total: total,
        message: message,
        shortsMenuYokCount: extraStats?.shortsMenuYokCount || 0,
        normalMenuYokCount: extraStats?.normalMenuYokCount || 0,
        shortsMenuYokTitles: extraStats?.shortsMenuYokTitles || [],
        normalMenuYokTitles: extraStats?.normalMenuYokTitles || []
      });
    } catch (error) {
      // Silent error - popup might not be open
      console.log(`📊 Progress: ${current}/${total} - ${message}`);
    }
  }

  // 🆕 Yardımcı fonksiyonlar
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}