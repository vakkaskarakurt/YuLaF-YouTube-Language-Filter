class DebugConsole {
  constructor(filter) {
    this.filter = filter;
    this.startTime = Date.now();
    this.setupDebugConsole();
  }

  setupDebugConsole() {
    window.YEF_DEBUG = {
      stats: () => this.getFullStats(),
      cache: () => this.filter.languageDetector.cache.getStats(),
      clear: () => this.clearAll(),
      test: (text) => this.filter.languageDetector.detectLanguage(text),
      reprocess: () => this.filter.videoProcessor.reprocessAllVideos(true)
    };

    console.log('🎯 YouTube English Filter DEBUG MODE - YEF_DEBUG object available');
  }

  getFullStats() {
    const languageStats = this.filter.languageDetector.getStats();
    const videoStats = this.filter.videoProcessor.getStats();
    const runtime = Math.round((Date.now() - this.startTime) / 1000);

    return {
      runtime: `${runtime}s`,
      language: languageStats,
      video: videoStats,
      performance: {
        totalCacheHits: languageStats.cacheHits,
        cacheHitRate: languageStats.hitRate,
        videosPerSecond: runtime > 0 ? (videoStats.totalProcessed / runtime).toFixed(2) : '0'
      }
    };
  }

  clearAll() {
    this.filter.languageDetector.clearCache();
    this.filter.videoProcessor.destroy();
    console.log('🧹 All caches and stats cleared');
  }
}