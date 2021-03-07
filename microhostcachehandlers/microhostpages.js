var cachehandler = require("../cache/cacheHandler");
var MongoDBClient = require('mongodb').MongoClient;
const OID = "_id";
const IPADDR = "ipAddr";
const KEY = "key";
const PUBLICURLSUFFIX = "publicURLSuffix";
const CREATEDDATE = "createdDate";
const EXPIRATION = "expiration";
const MIMETYPE = "mimetype";
const DATA = "data";


class mhpCacheHandler extends cachehandler {
  constructor(settings, callback){
    super(settings);

    this.settings = settings;
    this.microhostDBClient = new MongoDBClient();
    this.microhostDBObj;
    this.collectionName = "pages";
    var that = this;

    this.connectDB(this.settings, function(db, err){
      if (err){
        console.log(err);
      } else {
        that.microhostDBObj = db;
        // console.log(that.microhostDBObj);
        callback();
      }
    });
  }

  connectDB(mongoSettings, callback){
      var url = 'mongodb://' + mongoSettings.mongodb_host + ':' + mongoSettings.mongodb_port + '/' + mongoSettings.mongodb_database;

      try {
        this.microhostDBClient.connect(url, function(err, db){
          if (err){
            console.log(err);
            callback(undefined, err);
          } else {
            callback(db, undefined);
          }
        });
      } catch (err){
        console.log(err);
        callback(undefined, err);
      }
  }

  populateObjects(callback){
    var dataArray = [];

    this.microhostDBObj.collection(this.collectionName).find({}).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
         for (var i = 0; i < result.length; i++){
           var thisData = result[i];
           var newData = {};

           newData[IPADDR] = thisData[IPADDR];
           newData[KEY] = thisData[KEY];
           newData[PUBLICURLSUFFIX] = thisData[PUBLICURLSUFFIX];
           newData[CREATEDDATE] = thisData[CREATEDDATE];
           newData[EXPIRATION] = thisData[EXPIRATION];
           newData[DATA] = thisData[DATA];
           newData[MIMETYPE] = thisData[MIMETYPE];
           newData[OID] = thisData[OID];

           dataArray.push(newData);
         }

         callback(dataArray, undefined);
      }
    });
  }

  createObject(idField, writeObject, callback){
    // callback(writeObject, err);
    // Add Created Date here
    var timeStamp = new Date();
    writeObject[CREATEDDATE] = timeStamp.toISOString();

    this.microhostDBObj.collection(this.collectionName).insertOne(writeObject, function (err, result) {
      if (err){
        console.log(err);
        callback(writeObject, err);
      } else {
        var returnObj = result.ops[0];
        var newObject = {};

        newObject[IPADDR] = returnObj[IPADDR];
        newObject[KEY] = returnObj[KEY];
        newObject[PUBLICURLSUFFIX] = returnObj[PUBLICURLSUFFIX];
        newObject[CREATEDDATE] = returnObj[CREATEDDATE];
        newObject[EXPIRATION] = returnObj[EXPIRATION];
        newObject[DATA] = returnObj[DATA];
        newObject[MIMETYPE] = returnObj[MIMETYPE];
        newObject[OID] = returnObj[OID];


        callback(newObject, undefined);
      }
    });
  }

  updateObject(id, idField, writeObject, callback){
    var query = {};
    query[idField] = id;

    this.microhostDBObj.collection(this.collectionName).updateOne(query, writeObject, function (err, result) {
      if (err){
        console.log(err);
        callback(writeObject, err);
      } else {
        // var returnObj = result.ops[0];
        // var newObject = {};
        //
        // newObject[IPADDR] = returnObj[IPADDR];
        // newObject[KEY] = returnObj[KEY];
        // newObject[PUBLICURLSUFFIX] = returnObj[PUBLICURLSUFFIX];
        // newObject[CREATEDDATE] = returnObj[CREATEDDATE];
        // newObject[EXPIRATION] = returnObj[EXPIRATION];
        // newObject[DATA] = returnObj[DATA];
        // newObject[MIMETYPE] = returnObj[MIMETYPE];
        // newObject[OID] = returnObj[OID];

        callback(writeObject, undefined);
      }
    });
  }

  getObject(id, idField, callback){
    var query = {};
    query[idField] = id;

    this.microhostDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
        if (result.length > 0){
          var newObject = {};
          var thisResult = result[0];

          newObject[IPADDR] = thisResult[IPADDR];
          newObject[KEY] = thisResult[KEY];
          newObject[PUBLICURLSUFFIX] = thisResult[PUBLICURLSUFFIX];
          newObject[CREATEDDATE] = thisResult[CREATEDDATE];
          newObject[EXPIRATION] = thisResult[EXPIRATION];
          newObject[DATA] = thisResult[DATA];
          newObject[MIMETYPE] = result[MIMETYPE];
          newObject[OID] = thisResult[OID];

          callback(newObject, undefined);

        } else {
          callback(undefined, undefined);
        }
      }
    });
  }

  deleteObject(id, idField, removedObject, callback){
    console.log(id);
    console.log(idField);
    console.log(this.collectionName);
    var query = {};
    query[idField] = id;

    var that = this;
    this.microhostDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(err);
      } else {
        // console.log(result);
        if (result.length > 0){
          that.microhostDBObj.collection(that.collectionName).deleteOne(result[0], function(err2, result2){
            if (err2){
              console.log(err2);
              callback(err2);
            } else {
              callback(undefined);
            }
          });
        } else {
          callback(undefined);
        }
      }
    });
  }
}

module.exports = mhpCacheHandler;
