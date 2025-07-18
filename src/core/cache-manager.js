class CacheManager {
  constructor(maxSize = 1000, ttlMs = 600000) {
    this.cache = new Map();
    this.timestamps = new Map();
    this.accessCount = new Map();
    this.maxSize = maxSize;
    this.ttl = ttlMs;
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      
      // LRU reordering
      this.cache.delete(key);
      this.cache.set(key, value);
      
      // Access count artır
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
      
      return value;
    }
    
    return null;
  }

  set(key, value) {
    const now = Date.now();
    
    // Mevcut key güncelleme
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } 
    // Capacity kontrolü
    else if (this.cache.size >= this.maxSize) {
      this.evictLeastValuable();
    }
    
    // Yeni entry ekle
    this.cache.set(key, value);
    this.timestamps.set(key, now);
    this.accessCount.set(key, 1);
  }

  evictLeastValuable() {
    let leastValuable = null;
    let minScore = Infinity;
    
    for (const [key] of this.cache) {
      const accessCount = this.accessCount.get(key) || 1;
      const age = Date.now() - (this.timestamps.get(key) || 0);
      
      const score = accessCount / Math.max(age / 60000, 1);
      
      if (score < minScore) {
        minScore = score;
        leastValuable = key;
      }
    }
    
    if (leastValuable) {
      this.delete(leastValuable);
    }
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.accessCount.delete(key);
  }

  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, timestamp] of this.timestamps) {
      if (now - timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.accessCount.clear();
  }

  size() {
    return this.cache.size;
  }

  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.keys()).map(key => ({
      key: key.substring(0, 40),
      value: this.cache.get(key),
      age: Math.round((now - (this.timestamps.get(key) || now)) / 60000),
      accessCount: this.accessCount.get(key) || 0
    }));
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount)
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}