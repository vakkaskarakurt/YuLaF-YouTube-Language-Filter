class DOMUtils {
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ✨ YENİ: CSS injection sistemi
  static injectCSS(cssText, id = 'youtube-english-filter-styles') {
    // Mevcut style'ı kontrol et
    let existingStyle = document.getElementById(id);
    
    if (existingStyle) {
      existingStyle.textContent = cssText;
    } else {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = cssText;
      document.head.appendChild(style);
    }
  }

  // ✨ YENİ: Filter CSS'lerini inject et
  static injectFilterStyles() {
    const css = `
      /* 🎬 YouTube English Filter - Geliştirilmiş Gizleme Sistemi */
      
      /* ÖNCELİK: Baştan HERŞEYİ tamamen gizle */
      ytd-video-renderer:not([data-processed]),
      ytd-rich-item-renderer:not([data-processed]),
      ytd-grid-video-renderer:not([data-processed]),
      ytd-compact-video-renderer:not([data-processed]),
      ytd-channel-renderer:not([data-processed]),
      yt-lockup-view-model:not([data-processed]),
      ytd-playlist-renderer:not([data-processed]),
      ytd-movie-renderer:not([data-processed]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* İşleme alınmış ama henüz karar verilmemiş */
      .yef-processing {
        display: none !important;
        visibility: hidden !important;
      }

      /* ✅ English content - Smooth gösterim */
      .yef-english {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: translateY(0) !important;
        transition: opacity 0.3s ease, transform 0.3s ease !important;
      }

      /* ❌ Non-English - Kalıcı gizleme */
      .yef-hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
      }

      /* 🔄 Filter disabled - Acil gösterim */
      .yef-filter-disabled ytd-video-renderer,
      .yef-filter-disabled ytd-rich-item-renderer,
      .yef-filter-disabled ytd-grid-video-renderer,
      .yef-filter-disabled ytd-compact-video-renderer,
      .yef-filter-disabled ytd-channel-renderer,
      .yef-filter-disabled yt-lockup-view-model,
      .yef-filter-disabled ytd-playlist-renderer,
      .yef-filter-disabled ytd-movie-renderer {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      /* 🎨 Güzel görünüm için grid düzenlemesi */
      .yef-english {
        margin-bottom: 16px !important;
      }

      /* Container'ların boş görünmemesi için */
      ytd-section-list-renderer,
      ytd-rich-grid-renderer,
      ytd-item-section-renderer {
        min-height: auto !important;
      }
    `;
    
    DOMUtils.injectCSS(css, 'yef-hide-first-styles');
  }

  static createMutationObserver(callback, options = {}) {
    const defaultOptions = {
      childList: true,
      subtree: true
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(document.body, { ...defaultOptions, ...options });
    return observer;
  }

  static waitForElement(selector, timeout = 5000) {
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
}