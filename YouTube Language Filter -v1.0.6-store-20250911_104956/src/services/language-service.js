// src/services/language-service.js
window.LanguageService = {
  selectedLanguages: [],
  strictMode: true,

  // 🔹 Cache & stats
  textCache: new Map(),
  cacheStats: { hits: 0, misses: 0 },

  cacheConfig: {
    maxSize: 1000,          // Maksimum kayıt
    ttl: 30 * 60 * 1000,    // 30 dk
    cleanupInterval: 5 * 60 * 1000 // 5 dk
  },

  init() {
    this.clearCache();
    this.startCacheCleanup();
  },

  setLanguages(langCodes) {
    const valid = langCodes.filter(code => window.YT_FILTER_CONFIG.languages[code]);

    if (JSON.stringify(valid) !== JSON.stringify(this.selectedLanguages)) {
      this.clearCache();
      this.selectedLanguages = valid;
    }
    return true;
  },

  setStrictMode(enabled) {
    if (this.strictMode !== enabled) {
      this.clearCache();
      this.strictMode = enabled;
    }
  },

  // 🔹 Normalization helpers
  normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // çoklu boşluk → tek boşluk
      .replace(/[^\w\s\u0080-\uFFFF]/g, ''); // özel karakterleri temizle
  },

  createCacheKey(text, langs, strict) {
    return `${this.normalizeText(text)}|${langs.sort().join(',')}|${strict ? 'strict' : 'normal'}`;
  },

  // 🔹 Cache ops
  getCachedResult(key) {
    const entry = this.textCache.get(key);
    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.cacheConfig.ttl) {
      this.textCache.delete(key);
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    return entry.result;
  },

  setCachedResult(key, result) {
    if (this.textCache.size >= this.cacheConfig.maxSize) {
      this.cleanupOldEntries();
    }
    this.textCache.set(key, { result, timestamp: Date.now() });
  },

  cleanupOldEntries() {
    const now = Date.now();
    let deleted = 0;

    // TTL geçmişleri sil
    for (const [key, val] of this.textCache.entries()) {
      if (now - val.timestamp > this.cacheConfig.ttl) {
        this.textCache.delete(key);
        deleted++;
      }
    }

    // Hala çok büyükse → en eski %20 sil
    if (this.textCache.size >= this.cacheConfig.maxSize) {
      const oldest = [...this.textCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      oldest.slice(0, Math.floor(this.cacheConfig.maxSize * 0.2)).forEach(([key]) => {
        this.textCache.delete(key);
        deleted++;
      });
    }

    console.log(`Cache cleanup: ${deleted} entries deleted. Size: ${this.textCache.size}`);
  },

  startCacheCleanup() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => this.cleanupOldEntries(), this.cacheConfig.cleanupInterval);
  },

  clearCache() {
    this.textCache.clear();
    this.cacheStats = { hits: 0, misses: 0 };
  },

  getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? ((this.cacheStats.hits / total) * 100).toFixed(1) : 0;

    return {
      size: this.textCache.size,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      total,
      hitRate: `${hitRate}%`
    };
  },

  // 🔹 Asıl language detect
  async detectLanguage(text) {
    if (!text || text.length < window.YT_FILTER_CONFIG.detection.minLength) return false;
    if (this.selectedLanguages.length === 0) return false;

    const key = this.createCacheKey(text, this.selectedLanguages, this.strictMode);

    const cached = this.getCachedResult(key);
    if (cached !== null) return cached;

    try {
      const result = await window.LanguageDetector.detect(text, this.selectedLanguages, this.strictMode);
      this.setCachedResult(key, result);
      return result;
    } catch (err) {
      console.error('Language detection error:', err);
      this.setCachedResult(key, false); // hata durumunda kısa süreliğine false cache
      return false;
    }
  }
};

// İlk yükte init et
if (typeof window !== 'undefined') {
  window.LanguageService.init();

  window.addEventListener('beforeunload', () => {
    if (window.LanguageService.cleanupTimer) clearInterval(window.LanguageService.cleanupTimer);
  });
}
