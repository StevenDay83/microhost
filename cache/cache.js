// Collection of Cacheable

class cache {
  constructor () {
    this.cacheTable = {};
  }

  setCacheObject(id, cacheObj){
    this.cacheTable[id] = cacheObj;
  }

  getCacheObject(id){
    return this.cacheTable[id];
  }

  deleteCacheObject(id){
    delete(this.cacheTable[id]);
  }

  getCacheAll(){
    return this.cacheTable;
  }
}

module.exports = cache;
