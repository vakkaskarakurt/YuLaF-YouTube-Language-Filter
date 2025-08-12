// src/services/language-service.js - Güncellenmiş
window.LanguageService = {
  selectedLanguages: [],
  strictMode: true,
  
  // Text-based cache sistemi
  textCache: new Map(),
  cacheStats: { hits: 0, misses: 0 },
  
  // Cache ayarları
  cacheConfig: {
    maxSize: 1000,        // Maksimum cache entry sayısı
    ttl: 1800000,         // 30 dakika (milliseconds)
    cleanupInterval: 300000 // 5 dakikada bir cleanup
  },
  
  init() {
    this.textCache = new Map();
    this.cacheStats = { hits: 0, misses: 0 };
    
    // Periyodik cache temizliği
    this.startCacheCleanup();
  },
  
  setLanguages(langCodes) {
    const newLanguages = langCodes.filter(code => 
      window.YT_FILTER_CONFIG.languages[code]
    );
    
    // Eğer diller değiştiyse cache'i temizle
    if (JSON.stringify(this.selectedLanguages) !== JSON.stringify(newLanguages)) {
      this.clearCache();
      this.selectedLanguages = newLanguages;
    }
    
    return true;
  },
  
  setStrictMode(enabled) {
    // Strict mode değiştiyse cache'i temizle
    if (this.strictMode !== enabled) {
      this.clearCache();
      this.strictMode = enabled;
    }
  },
  
  // Text'i normalize et (cache key için)
  normalizeText(text) {
    return text.trim()
               .toLowerCase()
               .replace(/\s+/g, ' ')    // Çoklu boşlukları tek boşluk yap
               .replace(/[^\w\s\u0080-\uFFFF]/g, ''); // Özel karakterleri temizle
  },
  
  // Cache key oluştur
  createCacheKey(text, targetLanguages, strictMode) {
    const normalizedText = this.normalizeText(text);
    const langKey = targetLanguages.sort().join(',');
    return `${normalizedText}|${langKey}|${strictMode ? 'strict' : 'normal'}`;
  },
  
  // Cache'den değer oku
  getCachedResult(cacheKey) {
    const cached = this.textCache.get(cacheKey);
    
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }
    
    // TTL kontrolü
    const now = Date.now();
    if (now - cached.timestamp > this.cacheConfig.ttl) {
      this.textCache.delete(cacheKey);
      this.cacheStats.misses++;
      return null;
    }
    
    this.cacheStats.hits++;
    return cached.result;
  },
  
  // Cache'e değer yaz
  setCachedResult(cacheKey, result) {
    // Cache boyut kontrolü
    if (this.textCache.size >= this.cacheConfig.maxSize) {
      this.cleanupOldEntries();
    }
    
    this.textCache.set(cacheKey, {
      result: result,
      timestamp: Date.now(),
      accessCount: 1
    });
  },
  
  // Cache temizliği
  cleanupOldEntries() {
    const now = Date.now();
    const entries = Array.from(this.textCache.entries());
    
    // TTL'si geçmiş entryleri temizle
    let deletedCount = 0;
    for (const [key, value] of entries) {
      if (now - value.timestamp > this.cacheConfig.ttl) {
        this.textCache.delete(key);
        deletedCount++;
      }
    }
    
    // Hala çok büyükse, en eski entryleri sil
    if (this.textCache.size >= this.cacheConfig.maxSize) {
      const sortedEntries = Array.from(this.textCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToDelete = sortedEntries.slice(0, Math.floor(this.cacheConfig.maxSize * 0.2));
      entriesToDelete.forEach(([key]) => {
        this.textCache.delete(key);
        deletedCount++;
      });
    }
    
    console.log(`Cache cleanup: ${deletedCount} entries deleted. Size: ${this.textCache.size}`);
  },
  
  // Periyodik cleanup başlat
  startCacheCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEntries();
    }, this.cacheConfig.cleanupInterval);
  },
  
  // Cache'i temizle
  clearCache() {
    this.textCache.clear();
    this.cacheStats = { hits: 0, misses: 0 };
  },
  
  // Cache istatistikleri
  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? (this.cacheStats.hits / total * 100).toFixed(1) : 0;
    
    return {
      size: this.textCache.size,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: `${hitRate}%`,
      total: total
    };
  },
  
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) {
      return false;
    }
    
    if (this.selectedLanguages.length === 0) {
      return false;
    }
    
    // Cache key oluştur
    const cacheKey = this.createCacheKey(text, this.selectedLanguages, this.strictMode);
    
    // Cache'den kontrol et
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult !== null) {
      return cachedResult;
    }
    
    try {
      // API'den sonuç al
      const result = await window.LanguageDetector.detect(text, this.selectedLanguages, this.strictMode);
      
      // Sonucu cache'le
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Language detection error:', error);
      
      // Hata durumunda false cache'le (kısa süreliğine)
      this.setCachedResult(cacheKey, false);
      return false;
    }
  }
};

// İlk başlatma
if (typeof window !== 'undefined') {
  window.LanguageService.init();
}

// Sayfa kapatılırken cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (window.LanguageService.cleanupTimer) {
      clearInterval(window.LanguageService.cleanupTimer);
    }
  });
}