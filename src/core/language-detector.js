class LanguageDetector {
  constructor() {
    this.cache = new Map(); // ✅ Basit Map kullan, CacheManager değil
    this.eldLoaded = false;

    this.stats = {
      totalDetections: 0,
      cacheHits: 0,
      englishDetected: 0,
      nonEnglishDetected: 0,
      lowConfidenceFiltered: 0,
    };
  }

  async loadELD() {
    return new Promise((resolve, reject) => {
      if (typeof eld !== "undefined") {
        this.eldLoaded = true;
        console.log("✅ ELD already loaded");
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = chrome.runtime.getURL("libs/eld.XS60.min.js");

      script.onload = () => {
        console.log("✅ ELD loaded successfully");
        this.eldLoaded = true;
        resolve();
      };

      script.onerror = (error) => {
        console.error("❌ ELD loading failed:", error);
        this.eldLoaded = false;
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  async detectLanguage(text, context = "unknown") {
    if (!text || text.length < 3) {
      return "non-en";
    }

    const normalizedText = this.normalizeText(text);
    const cacheKey = normalizedText;

    this.stats.totalDetections++;

    // ✅ Map API kullan
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    try {
      if (!this.eldLoaded || typeof eld === "undefined") {
        console.warn("⚠️ ELD not available, using fallback");
        const fallbackResult = this.fallbackDetection(normalizedText);
        this.cache.set(cacheKey, fallbackResult); // ✅ Map API kullan
        return fallbackResult;
      }

      const result = eld.detect(normalizedText);
      const language = result.language || "en";
      const scores = result.getScores();
      const englishScore = scores["en"] || 0;

      const threshold = this.calculateThreshold(context);

      let finalLanguage;

      if (language === "en" && englishScore < threshold) {
        finalLanguage = "non-en";
        this.stats.lowConfidenceFiltered++;
      } else {
        finalLanguage = language === "en" ? "en" : "non-en";
      }

      if (finalLanguage === "en") {
        this.stats.englishDetected++;
      } else {
        this.stats.nonEnglishDetected++;
      }

      // ✅ Map API kullan
      this.cache.set(cacheKey, finalLanguage);
      return finalLanguage;
    } catch (error) {
      console.error("❌ ELD detection error:", error);
      const fallbackResult = "non-en";
      this.cache.set(cacheKey, fallbackResult); // ✅ Map API kullan
      return fallbackResult;
    }
  }

  calculateThreshold(context) {
    switch (context) {
      case "trending":
      case "homepage":
        return 0.25;
      case "search":
        return 0.35;
      case "shorts":
        return 0.4;
      default:
        return 0.3;
    }
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .substring(0, 200);
  }

  fallbackDetection(text) {
    const englishKeywords = [
      "the",
      "and",
      "for",
      "you",
      "how",
      "to",
      "in",
      "with",
      "of",
      "is",
      "a",
      "an",
      "tutorial",
      "learn",
      "guide",
      "tips",
      "review",
      "vs",
      "best",
      "javascript",
      "python",
      "react",
      "vue",
      "node",
      "css",
      "html",
    ];

    const words = text.toLowerCase().split(" ");
    const englishWordCount = words.filter(
      (word) => englishKeywords.includes(word) || /^[a-z]+$/.test(word)
    ).length;

    const englishRatio = englishWordCount / Math.max(words.length, 1);

    return englishRatio > 0.6 ? "en" : "non-en";
  }

  clearCache() {
    this.cache.clear(); // ✅ Map API kullan
    console.log("🔄 Language detector cache cleared");
  }

  // DÜZELTİLMİŞ:
  getStats() {
    return {
      ...this.stats,
      hitRate:
        this.stats.totalDetections > 0
          ? ((this.stats.cacheHits / this.stats.totalDetections) * 100).toFixed(
              1
            ) + "%"
          : "0%",
      cacheSize: this.cache ? this.cache.size : 0, // ← Güvenli erişim
      eldLoaded: this.eldLoaded,
    };
  }

  destroy() {
    this.cache.clear(); // ✅ Map API kullan
    this.stats = {
      totalDetections: 0,
      cacheHits: 0,
      englishDetected: 0,
      nonEnglishDetected: 0,
      lowConfidenceFiltered: 0,
    };
  }
}
