class SimpleCache {
  constructor(ttlSeconds = 60) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = null) {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.ttl;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  delete(key) {
    this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
}

module.exports = new SimpleCache(300); // Default 5 minutes TTL
