// Cache Handler

class cacheHandler {
  constructor(settings = {}){
      this.settings = settings;
  }

  populateObjects(callback){
    callback();
  }

  createObject(idField, writeObject, callback){
    callback();
  }

  updateObject(id, idField, writeObject, callback){
    callback();
  }

  getObject(id, idField, callback){
    callback();
  }

  deleteObject(id, idField, removedObject, callback){
    callback();
  }
}

module.exports = cacheHandler;
