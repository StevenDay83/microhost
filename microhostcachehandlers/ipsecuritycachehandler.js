var cachehandler = require("../cache/cacheHandler");
var MongoDBClient = require('mongodb').MongoClient;

const OID = "_id";
const IPADDR = "ipAddr";
const CIDR = "cidr";
const ACTION = "action";

class ipSecurityCacheHandler extends cachehandler {
  constructor(settings, callback){
    super(settings);

    this.settings = settings;
    this.ipSecDBClient = new MongoDBClient();
    this.ipSecDBObj;
    this.collectionName = "ipsecurity";
    var that = this;

    this.connectDB(this.settings.database, function(db, err){
      if (err){
        console.log(err);
      } else {
        that.ipSecDBObj = db;
        // console.log(that.microhostDBObj);
        callback();
      }
    });
  }

  connectDB(mongoSettings, callback){
      var url = 'mongodb://' + mongoSettings.mongodb_host + ':' + mongoSettings.mongodb_port + '/' + mongoSettings.mongodb_database;

      try {
        this.ipSecDBClient.connect(url, function(err, db){
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

    this.ipSecDBObj.collection(this.collectionName).find({}).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
         for (var i = 0; i < result.length; i++){
           var thisData = result[i];
           var newData = {};

           // const OID = "_id";
           // const IPADDR = "ipAddr";
           // const CIDR = "cidr";
           // const ACTION = "action";

           newData[OID] = thisData[OID];
           newData[IPADDR] = thisData[IPADDR];
           newData[CIDR] = thisData[CIDR];
           newData[ACTION] = thisData[ACTION];

           dataArray.push(newData);
         }

         callback(dataArray, undefined);
      }
    });
  }

  createObject(idField, writeObject, callback){
    this.ipSecDBObj.collection(this.collectionName).insertOne(writeObject, function (err, result) {
      if (err){
        console.log(err);
        callback(writeObject, err);
      } else {
        var returnObj = result.ops[0];
        var newObject = {};

        newObject[OID] = returnObj[OID];
        newObject[IPADDR] = returnObj[IPADDR];
        newObject[CIDR] = returnObj[CIDR];
        newObject[ACTION] = returnObj[ACTION];

        callback(newObject, undefined);
      }
    });
  }

  updateObject(id, idField, writeObject, callback){
    var query = {};
    query[idField] = id;

    this.ipSecDBObj.collection(this.collectionName).updateOne(query, writeObject, function (err, result) {
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

    this.ipSecDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
        if (result.length > 0){
          var newObject = {};
          var thisResult = result[0];

          // newObject[OID] = returnObj[OID];
          // newObject[IPADDR] = returnObj[IPADDR];
          // newObject[CIDR] = returnObj[CIDR];
          // newObject[ACTION] = returnObj[ACTION];

          newObject[OID] = thisResult[OID];
          newObject[IPADDR] = thisResult[IPADDR];
          newObject[CIDR] = thisResult[CIDR];
          newObject[ACTION] = thisResult[ACTION];

          callback(newObject, undefined);

        } else {
          callback(undefined, undefined);
        }
      }
    });
  }

  deleteObject(id, idField, removedObject, callback){
    var query = {};
    query[idField] = id;

    var that = this;
    this.ipSecDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(err);
      } else {
        // console.log(result);
        if (result.length > 0){
          that.ipSecDBObj.collection(that.collectionName).deleteOne(result[0], function(err2, result2){
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

module.exports = ipSecurityCacheHandler;
