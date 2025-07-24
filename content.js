class YouTubeEnglishFilter {
 constructor() {
   this.enabled = true;
   this.settings = { 
     strictMode: true, 
     hideComments: true, 
     hideVideos: true, 
     hideChannels: true,
     useOriginalTitles: true
   };
   this.observer = null;
   this.urlObserver = null;
   this.popstateHandler = null;
   this.originalPushState = null;
   this.originalReplaceState = null;
   this.originalFetch = null;
   this.init();
 }

  // Content script'in init fonksiyonunu güncelle
  async init() {
    try {
      const stored = await chrome.storage.sync.get([
        'enabled', 'strictMode', 'hideComments', 'hideVideos', 'hideChannels', 'useOriginalTitles'
      ]);
      
      this.enabled = stored.enabled !== false;
      this.settings.strictMode = stored.strictMode !== false;
      this.settings.hideComments = stored.hideComments !== false;
      this.settings.hideVideos = stored.hideVideos !== false;
      this.settings.hideChannels = stored.hideChannels !== false;
      this.settings.useOriginalTitles = stored.useOriginalTitles !== false;
      
      // Storage değişikliklerini dinle
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
          let shouldRestart = false;
          
          // Enabled durumu değişti mi?
          if (changes.enabled && changes.enabled.newValue !== this.enabled) {
            this.enabled = changes.enabled.newValue;
            shouldRestart = true;
          }
          
          // Settings değişti mi?
          for (const key in changes) {
            if (key in this.settings && changes[key].newValue !== this.settings[key]) {
              this.settings[key] = changes[key].newValue;
              shouldRestart = true;
            }
          }
          
          // Gerekirse filtering'i yeniden başlat
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

 // YouTube'un çeviri özelliğini devre dışı bırak ve orijinal başlıkları geri yükle
 restoreOriginalTitles() {
   if (!this.settings.useOriginalTitles) return;

   try {
     // 1. Çeviri sistemini devre dışı bırak
     this.disableTranslationSystem();
     
     // 2. Ana video sayfasındaysa
     if (window.location.href.includes('/watch?')) {
       this.restoreCurrentVideoTitle();
     }
     
     // 3. Tüm video elementlerini güncelle
     this.restoreVideoListTitles();
     
     // 4. YouTube'un çeviri API'lerini engelle
     this.blockTranslationRequests();
   } catch (error) {
     console.warn('Error restoring original titles:', error);
   }
 }

 // Çeviri sistemini devre dışı bırak
 disableTranslationSystem() {
   try {
     // YouTube'un çeviri ayarlarını manipüle et
     if (window.yt && window.yt.config_) {
       // Çeviri özelliğini kapat
       if (window.yt.config_.EXPERIMENT_FLAGS) {
         window.yt.config_.EXPERIMENT_FLAGS.enable_video_title_translation = false;
         window.yt.config_.EXPERIMENT_FLAGS.enable_auto_translate = false;
       }
     }

     // localStorage'dan çeviri ayarlarını temizle
     try {
       localStorage.removeItem('yt-player-translation-prefs');
       localStorage.removeItem('yt-translate');
     } catch (e) {}

   } catch (error) {
     console.warn('Error disabling translation system:', error);
   }
 }

 // Network isteklerini engelle
 blockTranslationRequests() {
   if (this.originalFetch) return; // Zaten engellendi
   
   // Translation API isteklerini engelle
   this.originalFetch = window.fetch;
   window.fetch = (...args) => {
     const url = args[0];
     if (typeof url === 'string' && (
       url.includes('translate') || 
       url.includes('/youtubei/v1/player') ||
       url.includes('get_video_metadata')
     )) {
       // Translation ile ilgili istekleri engelle
       if (url.includes('translate')) {
         console.log('Blocked translation request:', url);
         return Promise.reject(new Error('Translation blocked'));
       }
     }
     return this.originalFetch.apply(window, args);
   };
 }

 restoreCurrentVideoTitle() {
   try {
     // Farklı yöntemlerle orijinal başlığı bul
     const methods = [
       () => this.getTitleFromMetadata(),
       () => this.getTitleFromPlayerAPI(),
       () => this.getTitleFromDOM(),
       () => this.getTitleFromCanonical()
     ];

     for (const method of methods) {
       const result = method();
       if (result && result.title) {
         this.applyOriginalTitle(result.title, result.description);
         break;
       }
     }
   } catch (error) {
     console.warn('Error restoring current video title:', error);
   }
 }

 // Metadata'dan başlığı al
 getTitleFromMetadata() {
   try {
     // Meta tag'lerden orijinal başlığı al
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
     
     if (title) {
       return { title: title };
     }
   } catch (error) {
     console.warn('Error getting title from metadata:', error);
   }
   return null;
 }

 // Player API'den başlığı al
 getTitleFromPlayerAPI() {
   try {
     if (window.ytInitialPlayerResponse?.videoDetails?.title) {
       return {
         title: window.ytInitialPlayerResponse.videoDetails.title,
         description: window.ytInitialPlayerResponse.videoDetails.shortDescription
       };
     }
   } catch (error) {
     console.warn('Error getting title from player API:', error);
   }
   return null;
 }

 // DOM'dan başlığı al
 getTitleFromDOM() {
   try {
     // H1 tag'inden orijinal başlığı bul
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
     console.warn('Error getting title from DOM:', error);
   }
   return null;
 }

 // Canonical URL'den başlığı al
 getTitleFromCanonical() {
   try {
     const canonical = document.querySelector('link[rel="canonical"]');
     if (canonical) {
       const href = canonical.getAttribute('href');
       const videoId = new URLSearchParams(href.split('?')[1])?.get('v');
       if (videoId) {
         // Video ID'si ile başlığı al (şimdilik basit DOM'dan al)
         const currentTitle = document.querySelector('title')?.textContent;
         if (currentTitle) {
           return { title: currentTitle.replace(' - YouTube', '') };
         }
       }
     }
   } catch (error) {
     console.warn('Error getting title from canonical:', error);
   }
   return null;
 }

 // Başlığı uygula
 applyOriginalTitle(title, description) {
   try {
     console.log('Applying original title:', title);
     
     // Sayfa başlığını güncelle
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
         console.log('Title restored in DOM:', title);
         break;
       }
     }

     // Meta tag'leri güncelle
     const ogTitle = document.querySelector('meta[property="og:title"]');
     if (ogTitle) ogTitle.setAttribute('content', title);
     
     const twitterTitle = document.querySelector('meta[name="twitter:title"]');
     if (twitterTitle) twitterTitle.setAttribute('content', title);
     
     const pageTitle = document.querySelector('title');
     if (pageTitle) pageTitle.textContent = title + ' - YouTube';

   } catch (error) {
     console.warn('Error applying original title:', error);
   }
 }

 restoreVideoListTitles() {
   // Video listelerindeki çevrilmiş başlıkları tespit et ve geri yükle
   const videoSelectors = [
     'ytd-video-renderer',
     'ytd-compact-video-renderer', 
     'ytd-grid-video-renderer',
     'ytd-rich-item-renderer'
   ];

   videoSelectors.forEach(selector => {
     document.querySelectorAll(selector).forEach(videoElement => {
       this.restoreVideoElementTitle(videoElement);
     });
   });
 }

 restoreVideoElementTitle(videoElement) {
   try {
     const titleElement = videoElement.querySelector('#video-title, h3 a, .ytd-video-meta-block #video-title');
     if (!titleElement) return;

     // Orijinal başlığı farklı kaynaklardan al
     let originalTitle = null;

     // 1. Title attribute'undan
     if (titleElement.hasAttribute('title') && titleElement.title !== titleElement.textContent.trim()) {
       originalTitle = titleElement.title;
     }

     // 2. Aria-label'dan
     if (!originalTitle && titleElement.hasAttribute('aria-label')) {
       originalTitle = titleElement.getAttribute('aria-label');
     }

     // 3. Data attribute'lardan
     if (!originalTitle) {
       const dataTitle = titleElement.getAttribute('data-original-title') || 
                        titleElement.getAttribute('data-title');
       if (dataTitle) {
         originalTitle = dataTitle;
       }
     }

     // Başlığı güncelle
     if (originalTitle && originalTitle !== titleElement.textContent.trim()) {
       titleElement.textContent = originalTitle;
       titleElement.setAttribute('title', originalTitle);
       console.log('List title restored:', originalTitle);
     }

   } catch (error) {
     console.warn('Error restoring video element title:', error);
   }
 }

 startFiltering() {
   if (!this.enabled) return;
   
   // Önce mevcut observer'ları temizle
   this.stopFiltering();
   
   // Orijinal başlıkları geri yükle - daha erken timing
   setTimeout(() => {
     this.restoreOriginalTitles();
   }, 0);
   
   this.filterContent();
   
   // ANINDA İŞLEME - Debounce yok
   this.observer = new MutationObserver(mutations => {
     if (!this.enabled) return;
     
     // Yeni eklenen elementleri anında işle
     mutations.forEach(mutation => {
       if (mutation.addedNodes.length > 0) {
         mutation.addedNodes.forEach(node => {
           if (node.nodeType === Node.ELEMENT_NODE) {
             this.processNewNode(node);
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
       console.log('🔄 URL changed:', lastUrl, '->', currentUrl);
       lastUrl = currentUrl;
       
       // URL değişiminde kısa bir gecikme - sayfa yüklenmesi için
       setTimeout(() => {
         if (this.enabled && location.href === currentUrl) {
           console.log('🔄 Processing after URL change');
           this.restoreOriginalTitles();
           this.filterContent();
         }
       }, 300); // 300ms - daha kısa
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
     // Direkt işle
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   
   history.replaceState = (...args) => {
     this.originalReplaceState.apply(history, args);
     // Direkt işle
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   
   // Popstate eventi (geri/ileri butonları)
   this.popstateHandler = () => {
     setTimeout(() => {
       if (this.enabled) {
         this.restoreOriginalTitles();
         this.filterContent();
       }
     }, 200);
   };
   window.addEventListener('popstate', this.popstateHandler);
 }

 // Yeni fonksiyon - Node'u anında işle
 processNewNode(node) {
   // Önce orijinal başlıkları geri yükle
   if (this.settings.useOriginalTitles) {
     if (node.matches && (
       node.matches('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer') ||
       node.querySelector('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer')
     )) {
       setTimeout(() => this.restoreVideoElementTitle(node), 100);
     }
   }

   // Video selectors
   const videoSelectors = [
     'ytd-video-renderer',
     'ytd-compact-video-renderer', 
     'ytd-grid-video-renderer',
     'ytd-rich-item-renderer',
     'ytd-reel-item-renderer',
     'ytd-shorts-lockup-view-model',
     'ytm-shorts-lockup-view-model-v2',
     'ytd-movie-renderer',
     'ytd-playlist-renderer',
     'ytd-radio-renderer',
     'ytd-rich-grid-media',
     'yt-lockup-view-model',
     'ytd-rich-section-renderer'
   ];
   
   const commentSelectors = ['ytd-comment-thread-renderer', 'ytd-comment-renderer'];
   const channelSelectors = ['ytd-channel-renderer'];
   
   // Ad kontrolü
   const isAd = node.matches && (
     node.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') ||
     node.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')
   );
   
   if (isAd) return;
   
   // Video elementiyse anında gizle ve işle
   if (this.settings.hideVideos && videoSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'video');
   }
   
   // Comment elementiyse anında gizle ve işle
   if (this.settings.hideComments && commentSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'comment');
   }
   
   // Channel elementiyse anında gizle ve işle
   if (this.settings.hideChannels && channelSelectors.some(selector => node.matches && node.matches(selector))) {
     this.checkElement(node, 'channel');
   }
   
   // İçindeki elementleri de kontrol et
   if (node.querySelectorAll) {
     if (this.settings.hideVideos) {
       const innerVideos = node.querySelectorAll(videoSelectors.join(','));
       innerVideos.forEach(video => {
         if (!video.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') && 
             !video.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) {
           this.checkElement(video, 'video');
         }
       });
     }
     
     if (this.settings.hideComments) {
       const innerComments = node.querySelectorAll(commentSelectors.join(','));
       innerComments.forEach(comment => this.checkElement(comment, 'comment'));
     }
     
     if (this.settings.hideChannels) {
       const innerChannels = node.querySelectorAll(channelSelectors.join(','));
       innerChannels.forEach(channel => this.checkElement(channel, 'channel'));
     }
   }
 }

 stopFiltering() {
   // Observer'ları durdur
   if (this.observer) {
     this.observer.disconnect();
     this.observer = null;
   }
   
   if (this.urlObserver) {
     this.urlObserver.disconnect();
     this.urlObserver = null;
   }
   
   // History API'yi geri yükle
   if (this.originalPushState) {
     history.pushState = this.originalPushState;
   }
   
   if (this.originalReplaceState) {
     history.replaceState = this.originalReplaceState;
   }
   
   // Fetch API'yi geri yükle
   if (this.originalFetch) {
     window.fetch = this.originalFetch;
     this.originalFetch = null;
   }
   
   // Popstate listener'ı kaldır
   if (this.popstateHandler) {
     window.removeEventListener('popstate', this.popstateHandler);
   }
   
   // Gizlenmiş içerikleri göster
   this.showHiddenContent();
 }

 filterContent() {
   if (!this.enabled) return;

   // Önce orijinal başlıkları geri yükle
   setTimeout(() => this.restoreOriginalTitles(), 0);

   // Gelişmiş selector sistemi - tek kombine selector ile daha performanslı
   const combinedVideoSelector = [
     'ytd-video-renderer',
     'ytd-compact-video-renderer', 
     'ytd-grid-video-renderer',
     'ytd-rich-item-renderer',
     'ytd-reel-item-renderer',
     'ytd-shorts-lockup-view-model',
     'ytm-shorts-lockup-view-model-v2',
     // Ek selectors:
     'ytd-movie-renderer',
     'ytd-playlist-renderer',
     'ytd-radio-renderer',
     'ytd-rich-grid-media',
     'yt-lockup-view-model',
     'ytd-rich-section-renderer'
   ].join(',');

   const commentSelector = [
     'ytd-comment-thread-renderer',
     'ytd-comment-renderer'
   ].join(',');

   const channelSelector = [
     'ytd-channel-renderer'
   ].join(',');

   // Ad filtreleme fonksiyonu
   const isStrictAdElement = (element) => {
     // Element kendisi ad mı? (en hızlı kontrol)
     if (element.matches('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer')) {
       return true;
     }
     // Ad container içinde mi? (daha yavaş, ikinci kontrol)
     return element.closest('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer') !== null;
   };

   if (this.settings.hideVideos) {
     // Tek query ile tüm video elementlerini al ve ad filtresi uygula
     const allVideoElements = Array.from(document.querySelectorAll(combinedVideoSelector));
     const filteredVideoElements = allVideoElements.filter(element => !isStrictAdElement(element));
     const uniqueVideoElements = [...new Set(filteredVideoElements)]; // Duplikat temizliği
     
     uniqueVideoElements.forEach(el => this.checkElement(el, 'video'));
   }
   
   if (this.settings.hideComments) {
     const allCommentElements = Array.from(document.querySelectorAll(commentSelector));
     const filteredCommentElements = allCommentElements.filter(element => !isStrictAdElement(element));
     
     filteredCommentElements.forEach(el => this.checkElement(el, 'comment'));
   }
   
   if (this.settings.hideChannels) {
     const allChannelElements = Array.from(document.querySelectorAll(channelSelector));
     const filteredChannelElements = allChannelElements.filter(element => !isStrictAdElement(element));
     
     filteredChannelElements.forEach(el => this.checkElement(el, 'channel'));
   }
 }

 async checkElement(element, type) {
   if (element.hasAttribute('data-english-filter-checked')) return;
   element.setAttribute('data-english-filter-checked', 'true');

   // Element'i anında gizle
   this.hideElement(element, type);

   // Önce orijinal içeriği geri yükle
   if (this.settings.useOriginalTitles && type === 'video') {
     this.restoreVideoElementTitle(element);
   }

   // Gelişmiş text selectors
   const textSelectors = {
     video: [
       // Öncelikli selectors (en yaygın olanlar önce)
       '#video-title',                           
       'a#video-title',                         
       'yt-formatted-string[id="video-title"]',  
       '[title]',                               
       'h3 a[href*="/watch"]',
       'a[href*="/watch"] h3',
       'h3',                          
       'yt-formatted-string#video-title',        
       '#video-title-link',
       'span[dir="auto"]',
       'a[href*="/shorts/"]',
       'a[href*="/playlist"] h3',
       '.ytd-video-meta-block #video-title',
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
       '#text',                    
       'ytd-channel-name a',
       '#channel-title',
       'yt-formatted-string',
       'a[href*="/channel/"]',
       'a[href*="/@"]',
       '.ytd-channel-name'
     ]
   };

   let text = '';
   for (const selector of textSelectors[type]) {
     const el = element.querySelector(selector);
     if (el) {
       let content = '';
       if (this.settings.useOriginalTitles && el.hasAttribute('title')) {
         content = el.title.trim();
       }
       if (!content) {
         content = el.textContent?.trim() || '';
       }
       
       if (content) {
         text += content + ' ';
       }
     }
   }

   if (text.trim()) {
     const isEnglish = await this.isEnglishText(text.trim());
     if (isEnglish) {
       // Sadece İngilizce olanları göster
       this.showElement(element);
     } else {
       // İngilizce olmayan için istatistik güncelle
       this.updateStats(type);
     }
   } else {
     // Text bulunamazsa güvenli tarafta kal ve göster
     this.showElement(element);
   }
 }

 isEnglishText(text) {
   if (!text || text.length < 3) return Promise.resolve(true);
   
   // Hızlı İngilizce Kontrolü
   if (/[^\x00-\x7F]/.test(text)) {
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
 }

 showElement(element) {
   element.style.visibility = '';
   element.style.opacity = '';
   element.style.display = '';
   element.removeAttribute('data-english-filter-hidden');
 }

 updateStats(type) {
   chrome.storage.local.get(['filterStats'], result => {
     const stats = result.filterStats || { videos: 0, comments: 0, channels: 0 };
     stats[type + 's'] = (stats[type + 's'] || 0) + 1;
     chrome.storage.local.set({ filterStats: stats });
   });
 }

 showHiddenContent() {
   document.querySelectorAll('[data-english-filter-hidden]').forEach(el => {
     this.showElement(el);
     // Kontrol flag'ini de temizle
     el.removeAttribute('data-english-filter-checked');
   });
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

 updateSettings(newSettings) {
   Object.assign(this.settings, newSettings);
   chrome.storage.sync.set(newSettings);
   
   if (this.enabled) {
     this.showHiddenContent();
     setTimeout(() => {
       this.restoreOriginalTitles();
       this.filterContent();
     }, 100);
   }
 }
}

// Initialize
const filter = new YouTubeEnglishFilter();

// Message listener'ı güncelle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
try {
  switch (request.action) {
    case 'toggle':
      sendResponse({ enabled: this.toggle() });
      break;
      
    case 'updateState':
      // State'i toplu güncelle
      if (request.state) {
        if (typeof request.state.enabled === 'boolean') {
          this.enabled = request.state.enabled;
        }
        
        Object.assign(this.settings, request.state);
        
        if (this.enabled) {
          this.startFiltering();
        } else {
          this.stopFiltering();
        }
      }
      sendResponse({ success: true, state: { enabled: this.enabled, settings: this.settings } });
      break;
      
    case 'updateSettings':
      Object.assign(this.settings, request.settings);
      
      if (this.enabled) {
        this.showHiddenContent();
        setTimeout(() => {
          this.restoreOriginalTitles();
          this.filterContent();
        }, 100);
      }
      sendResponse({ success: true });
      break;
      
    case 'getStatus':
      sendResponse({ 
        enabled: this.enabled,
        settings: this.settings
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