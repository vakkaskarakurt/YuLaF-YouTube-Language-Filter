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

  static injectFilterStyles() {
    const css = `
      /* 🎯 SIMPLE AND CLEAN - No opacity tricks */
      
      /* ❌ İNGİLİZCE OLMAYAN - Tamamen gizle */
      .yef-hidden {
        display: none !important;
      }
      
      /* ✅ İNGİLİZCE - Normal göster */
      .yef-english {
        display: block !important;
      }
      
      /* 🔄 İŞLEME AŞAMASINDA - Hafif gri */
      .yef-processing {
        opacity: 0.7 !important;
      }
      
      /* 🚫 FİLTER KAPALI - Hepsini göster */
      .yef-filter-disabled .yef-hidden {
        display: block !important;
      }
      
      /* 🎯 NO OPACITY MANIPULATION ON CONTAINERS */
      ytd-rich-item-renderer,
      ytd-video-renderer,
      ytd-grid-video-renderer {
        /* Remove any opacity rules */
      }
    `;
    
    this.injectCSS(css);
  }

  static injectCSS(css) {
    const style = document.createElement('style');
    style.textContent = css;
    style.id = 'yef-styles';
    document.head.appendChild(style);
  }

  static markPageAsLoaded() {
    document.body.classList.add('yef-loaded');
  }
}
