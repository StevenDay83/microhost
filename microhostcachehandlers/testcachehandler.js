var cachehandler = require("../cache/cacheHandler");

class testCacheHandler extends cachehandler {
  constructor(settings){
    super(settings);

    this.filename = settings;
  }

  populateObjects(callback){
    var fs = require("fs");

    // var data = fs.readFileSync(this.filename);
    // callback(data);

    fs.readFile(this.filename, function(err, data){
      if (!err){
        var dataArray = JSON.parse(data);

        // console.log(dataArray);

        callback(dataArray, undefined);
      } else {
        callback(undefined, err);
      }
    });
  }

  getObject(id, idField, callback){
    var fs = require("fs");
    var foundObject;

    fs.readFile(this.filename, function(err, data){
      if (!err){
        var dataArray = JSON.parse(data);

        for (var i = 0; i < dataArray.length; i++){
          var thisData = dataArray[i];
          // console.log(i + ":" + thisData);

          if (thisData[idField] == id){
            foundObject = thisData;
            break;
          }
        }

        callback(foundObject, undefined);
      } else {
        callback(undefined, err);
      }
    });
    // callback(undefined, undefined);
  }

  updateObject(id, idField, writeObject, callback){
    var fs = require("fs");
    var foundObject = false;
    var that = this;

    fs.readFile(this.filename, function(err, data){
      if (!err){
        var dataArray = JSON.parse(data);

        for (var i = 0; i < dataArray.length; i++){
          var thisData = dataArray[i];

          if (thisData[idField] == id){
            writeObject.id = id;
            dataArray[i] = writeObject;
            foundObject = true;
            break;
          }
        }

        if (foundObject){
          fs.writeFile(that.filename, JSON.stringify(dataArray), function(errWrite){
            callback(writeObject, errWrite);
          });
        } else {
          callback(writeObject, new Error("No record found to update"));
        }

      } else {
        callback(writeObject, err)
      }
    });
  }

  createObject(idField, writeObject, callback) {
    var fs = require("fs");
    var foundObject = false;
    var that = this;

    fs.readFile(this.filename, function(err, data){
      if (!err){
        var dataArray = JSON.parse(data);
        var highestId = 0;

        for (var i = 0; i < dataArray.length; i++){
          var thisData = dataArray[i];

          if (thisData != undefined){
            if (thisData[idField] > highestId){
              highestId = thisData[idField];
            }
          }
        }

        writeObject[idField] = highestId + 1;
        dataArray.push(writeObject);

        fs.writeFile(that.filename, JSON.stringify(dataArray), function(errWrite){
          callback(writeObject, errWrite);
        });
      } else {
        callback(writeObject, err);
      }
    });
  }

  deleteObject(id, idField, callback){
    var fs = require("fs");
    var foundObject = false;
    var that = this;
    var deletedObject;

    fs.readFile(this.filename, function(err, data) {
      if (!err){
        var dataArray = JSON.parse(data);
        var updatedArray = [];

        for (var i = 0; i < dataArray.length; i++){
          var thisData = dataArray[i];

          if (thisData[idField] == id){
            delete(dataArray[i]);
          } else {
            updatedArray.push(dataArray[i]);
          }
        }
        fs.writeFile(that.filename, JSON.stringify(updatedArray), function(errWrite){
          if (!errWrite){
            callback(undefined);
          } else {
            callback(errWrite);
          }
        });
      } else {
        callback(err);
      }
    });

  }
}

module.exports = testCacheHandler;
