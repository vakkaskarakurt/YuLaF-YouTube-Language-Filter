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
      /* 🎬 YouTube English Filter Styles */
      
      /* Başlangıçta videoları hafif şeffaf yap */
      ytd-video-renderer:not([data-processed]),
      ytd-rich-item-renderer:not([data-processed]),
      ytd-grid-video-renderer:not([data-processed]),
      ytd-compact-video-renderer:not([data-processed]),
      ytd-channel-renderer:not([data-processed]),
      yt-lockup-view-model:not([data-processed]) {
        opacity: 0.6 !important;
        transition: opacity 0.4s ease !important;
      }

      /* English content - tam görünür */
      .yef-english {
        opacity: 1 !important;
        transition: opacity 0.4s ease !important;
      }

      /* Non-English content - gizli */
      .yef-hidden {
        opacity: 0 !important;
        transform: scale(0.95) !important;
        pointer-events: none !important;
        transition: opacity 0.4s ease, transform 0.4s ease !important;
        margin: 2px 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      /* Filter disabled durumu */
      .yef-filter-disabled .yef-hidden {
        opacity: 1 !important;
        transform: scale(1) !important;
        pointer-events: auto !important;
        height: auto !important;
        margin: revert !important;
      }

      /* Loading state */
      .yef-processing {
        position: relative;
      }
      
      .yef-processing::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        animation: shimmer 1.5s infinite;
        pointer-events: none;
        z-index: 1;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    
    this.injectCSS(css);
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