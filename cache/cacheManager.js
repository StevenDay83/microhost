var cacheable = require("./cacheable");
var cache = require("./cache");

class cachemanager {
  constructor () {
    this.cacheTable = {};
  }

  createCache(cacheName, cacheHandler, keyField, isVolitile){
    var cacheableObject = new cacheable(new cache(), cacheHandler, keyField, isVolitile);

    this.cacheTable[cacheName] = cacheableObject;
  }

  initializeCache(cacheName, callback){
    var cacheableObject = this.cacheTable[cacheName];
    // console.log(this.cacheTable);

    if (cacheableObject != undefined){
      var cacheIdKey = cacheableObject.getIdKey();
      if (!cacheableObject.getIsVolitile()){
        var cacheHandlerObj = cacheableObject.getCacheHandler();

        cacheHandlerObj.populateObjects(function(dataArray, err){
          // cacheableObject.getCache().setCacheObject(cacheIdKey)

          if (!err){
            for (var i = 0; i < dataArray.length; i++){
              var thisObj = dataArray[i];
              var thisObjId = thisObj[cacheIdKey];

              cacheableObject.getCache().setCacheObject(thisObjId, thisObj);
            }
          }

          callback(err);
        });
      } else {
        callback(undefined);
      }
    }
  }

  getObjectById(cacheName, idKey, callback){
    var cacheableObject = this.cacheTable[cacheName];
    var requestedObject;

    if (cacheableObject != undefined){
      var cacheIdKey = cacheableObject.getIdKey();
      requestedObject = cacheableObject.getCache().getCacheObject(idKey);
      // console.log(cacheableObject.getCache().cacheTable);

      if (requestedObject == undefined && !cacheableObject.getIsVolitile()){
        cacheableObject.getCacheHandler().getObject(idKey, cacheIdKey, function(data, err){
          if (!err){
            if (data != undefined){
              requestedObject = data;
              console.log("Adding " + requestedObject + " to local cache");
              cacheableObject.getCache().setCacheObject(idKey, data);
              callback(requestedObject, undefined);
            } else {
              callback(undefined, undefined);
            }
          } else {
            callback(undefined, err);
          }
        });
      } else {
        callback(requestedObject, undefined);
      }
    } else {
      callback(requestedObject, undefined);
    }
  }

  getObjectByIdNoDB(cacheName, idKey, callback){
    var cacheableObject = this.cacheTable[cacheName];
    var requestedObject;

    if (cacheableObject != undefined){
      requestedObject = cacheableObject.getCache().getCacheObject(idKey);
    }

    callback(requestedObject, undefined);
  }

  updateObjectById(cacheName, idKey, writeObject, callback){
    var cacheableObject = this.cacheTable[cacheName];
    var cacheIdKey = cacheableObject.getIdKey();

    if (cacheableObject.getIsVolitile()){
      var existingObj = cacheableObject.getCache().getCacheObject(writeObject[cacheIdKey]);

      if (existingObj){
        cacheableObject.getCache().setCacheObject(idKey, writeObject);
        callback(writeObject, undefined);
      } else {
        callback(writeObject, new Error("Object does not exist"));
      }
    } else {
      if (cacheableObject != undefined && writeObject != undefined){
        cacheableObject.getCacheHandler().updateObject(idKey, cacheIdKey, writeObject, function (returnObj, err) {
          if (!err){
            cacheableObject.getCache().setCacheObject(idKey, returnObj);
            callback(returnObj, undefined);
          } else {
            callback(returnObj, err);
          }
        });
      } else {
        callback(undefined, new Error("Invalid parameters"));
      }
    }

  }

  createObject(cacheName, writeObject, callback){
    var cacheableObject = this.cacheTable[cacheName];
    var cacheIdKey = cacheableObject.getIdKey();


    if (cacheableObject != undefined && writeObject != undefined){
      if (cacheableObject.getIsVolitile()){
        var existingObj = cacheableObject.getCache().getCacheObject(writeObject[cacheIdKey]);

        if (!existingObj) {
          cacheableObject.getCache().setCacheObject(writeObject[cacheIdKey], writeObject);
          callback(writeObject, undefined);
        } else {
          callback(writeObject, new Error("Object exists"));
        }
      } else {
        cacheableObject.getCacheHandler().createObject(cacheIdKey, writeObject, function(returnObj, err){
          if (!err){
            cacheableObject.getCache().setCacheObject(returnObj[cacheIdKey], returnObj);
            callback(returnObj, undefined);
          } else {
            callback(returnObj, err);
          }
        });
      }
    } else {
      callback(undefined, new Error("Cache or object not found"));
    }
  }

  // Need a get all objects

  deleteObjectById(cacheName, idKey, callback){
    var cacheableObject = this.cacheTable[cacheName];
    var cacheIdKey = cacheableObject.getIdKey();
    this.getObjectById(cacheName, idKey, function(deleteObject, err){
      if (!err){
        if (cacheableObject != undefined && deleteObject != undefined && deleteObject[cacheIdKey] != undefined){
          var deleteId = deleteObject[cacheIdKey];

          if (cacheableObject.getIsVolitile()){
            cacheableObject.getCache().deleteCacheObject(deleteId);
            callback(deleteObject, undefined);
          } else {
            cacheableObject.getCacheHandler().deleteObject(idKey, cacheIdKey, deleteObject, function(errDelete){
              if (!errDelete){
                var deleteId = deleteObject[cacheIdKey];
                cacheableObject.getCache().deleteCacheObject(deleteId);
                callback(deleteObject, undefined);
              } else {
                callback(deleteObject, errDelete);
              }
            });
          }
        } else {
          callback(deleteObject, new Error("Cache or object invalid"));
        }
      } else {
        callback(deleteObject, new Error("Cache or object invalid"))
      }

    });
  }

  getAllObjects(cacheName, callback){
    try {
      var dataArray = [];
      var cacheTable = this.cacheTable[cacheName].getCache().getCacheAll();

      if (cacheTable != undefined){
        var cacheKeys = Object.keys(cacheTable);

        for (var i = 0; i < cacheKeys.length; i++){
          dataArray.push(cacheTable[cacheKeys[i]]);
        }

        callback(dataArray, undefined);
      } else {
        callback([], new Error("Cache empty"))
      }

    } catch (err) {
      callback(undefined, err);
    }
  }

  getKeyField(cacheName){
    var cacheableObject = this.cacheTable[cacheName];
    var cacheIdKey = cacheableObject.getIdKey();

    return cacheIdKey;
  }
}

module.exports = cachemanager;
