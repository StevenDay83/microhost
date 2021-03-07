// Cacheable Object

class Cacheable {
  constructor (c, ch, uid = 'id', volitile = false){
    this.cache = c;
    this.cacheHandler = ch;
    this.isVolitile = volitile;
    this.uniqueKeyName = uid;
  }

  getIdKey() {
    return this.uniqueKeyName;
  }

  getCache() {
    return this.cache;
  }

  setCache(c) {
    this.cache = c;
  }

  getCacheHandler() {
    return this.cacheHandler;
  }

  setCacheHandler(ch) {
    this.cacheHandler = ch;
  }

  getIsVolitile() {
    return this.isVolitile;
  }

  setIsVolitile(v) {
    this.isVolitile = v;
  }
}

module.exports = Cacheable;
