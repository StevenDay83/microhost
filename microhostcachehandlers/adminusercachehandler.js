var cachehandler = require("../cache/cacheHandler");
var MongoDBClient = require('mongodb').MongoClient;

const OID = "_id";
const USERNAME = "username";
const PASSWORD = "password";
const EMAIL = "email";
const CREATEDDATE = "createdDate";
const LASTLOGINDATE = "lastloginDate";
const LASTLOGINIP = "lastloginIP";
const FIRSTNAME = "firstname";
const LASTNAME = "lastname";

class adminUserCacheHandler extends cachehandler {
  constructor(settings, callback){
    super(settings);

    this.settings = settings;
    this.adminUserDBClient = new MongoDBClient();
    this.adminDBObj;
    this.collectionName = "adminusers";

    var that = this;

    this.connectDB(this.settings, function(db, err){
      if (err){
        console.log(err);
      } else {
        that.adminDBObj = db;
        // console.log(that.microhostDBObj);
        callback();
      }
    });
  }

  connectDB(mongoSettings, callback){
      var url = 'mongodb://' + mongoSettings.mongodb_host + ':' + mongoSettings.mongodb_port + '/' + mongoSettings.mongodb_database;

      try {
        this.adminUserDBClient.connect(url, function(err, db){
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

    this.adminDBObj.collection(this.collectionName).find({}).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
         for (var i = 0; i < result.length; i++){
           var thisData = result[i];
           var newData = {};

           newData[USERNAME] = thisData[USERNAME];
           newData[PASSWORD] = thisData[PASSWORD];
           newData[EMAIL] = thisData[EMAIL];
           newData[CREATEDDATE] = thisData[CREATEDDATE];
           newData[LASTLOGINDATE] = thisData[LASTLOGINDATE];
           newData[LASTLOGINIP] = thisData[LASTLOGINIP];
           newData[FIRSTNAME] = thisData[FIRSTNAME];
           newData[LASTNAME] = thisData[LASTNAME];
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

    this.adminDBObj.collection(this.collectionName).insertOne(writeObject, function (err, result) {
      if (err){
        console.log(err);
        callback(writeObject, err);
      } else {
        var returnObj = result.ops[0];
        var newObject = {};

        newObject[USERNAME] = returnObj[USERNAME];
        newObject[PASSWORD] = returnObj[PASSWORD];
        newObject[EMAIL] = returnObj[EMAIL];
        newObject[CREATEDDATE] = returnObj[CREATEDDATE];
        newObject[FIRSTNAME] = returnObj[FIRSTNAME];
        newObject[LASTNAME] = returnObj[LASTNAME];
        newObject[OID] = returnObj[OID];

        callback(newObject, undefined);
      }
    });
  }

  updateObject(id, idField, writeObject, callback){
    var query = {};
    query[idField] = id;

    this.adminDBObj.collection(this.collectionName).updateOne(query, writeObject, function (err, result) {
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

    this.adminDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(undefined, err);
      } else {
        if (result.length > 0){
          var newObject = {};
          var thisResult = result[0];

          newObject[USERNAME] = thisResult[USERNAME];
          newObject[PASSWORD] = thisResult[PASSWORD];
          newObject[EMAIL] = thisResult[EMAIL];
          newObject[CREATEDDATE] = thisResult[CREATEDDATE];
          newObject[LASTLOGINDATE] = thisResult[LASTLOGINDATE];
          newObject[LASTLOGINIP] = thisResult[LASTLOGINIP];
          newObject[FIRSTNAME] = thisResult[FIRSTNAME];
          newObject[LASTNAME] = thisResult[LASTNAME];
          newObject[OID] = thisResult[OID];

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
    this.adminDBObj.collection(this.collectionName).find(query).toArray(function(err, result){
      if (err){
        console.log(err);
        callback(err);
      } else {
        // console.log(result);
        if (result.length > 0){
          that.adminDBObj.collection(that.collectionName).deleteOne(result[0], function(err2, result2){
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

module.exports = adminUserCacheHandler;
