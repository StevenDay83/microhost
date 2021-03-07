
class microhostdata {
  constructor(cachemanager, settings){
    this.mhch = cachemanager;
    this.settings = settings;
  }

  rehashSettings(settings){
    this.settings = settings;
  }

  loadPageContent(idKey, callback){
    var pageData;
    var that = this;
    this.mhch.getObjectById("PagesCache", idKey, function(data, err){
      if (err){
        pageData = that.loadNotFoundPage();
        callback(pageData, "text/html", err);
      } else if (data == undefined || data.data == undefined){
        pageData = that.loadNotFoundPage();
        callback(pageData, "text/html", new Error());
      } else {
        pageData = Buffer.from(data.data.toString(), 'base64').toString();
        callback(pageData, data.mimetype, undefined);
      }
    });
  }

  createPageEntry(metaData, callback) {
    var mimetype = metaData["mimetype"].toLowerCase();
    var expiration = metaData["expiration"];
    var ipAddress = metaData["ipAddr"];

    if (mimetype != "text/html" && mimetype != "text/plain" && mimetype != "application/json"){
      callback(undefined, new Error ("invalid mimetype"));
    } else {
      if (expiration > 604800) {
        expiration = 604800;
      } else if (expiration < 86400){
        expiration = 86400;
      }

      var that = this;

      this.mhch.getAllObjects("PagesCache", function(dataArray, err){
        if (!err){
          that.generatePageKeyPair(dataArray, function(publicURLKey, privateAccessKey){

            var newPagesObject = {
              "ipAddr":ipAddress,
              "mimetype":mimetype,
              "expiration":expiration,
              "publicURLSuffix":publicURLKey,
              "key":privateAccessKey
            };

            that.mhch.createObject("PagesCache", newPagesObject, function(returnObj, err){
              if (err){
                callback(undefined, err);
              } else {
                var keyObject = {
                  "publicURLSuffix": returnObj["publicURLSuffix"],
                  "privateKey":returnObj["key"]
                }
                callback(keyObject, undefined);
              }
            });

            // callback(undefined, undefined);
          });

        } else {
          callback(undefined, err);
        }
      });

    }
  }

  deletePage(idKey, callback){
    var that = this;

    this.mhch.getObjectById("PagesCache", idKey, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
            that.mhch.deleteObjectById("PagesCache", idKey, function(deleteObj, err){
              if (!err){
                callback(deleteObj, undefined);
              } else {
                callback(undefined, err);
              }
            });
        } else {
          callback(undefined, undefined);
        }
      } else {
          callback(undefined, err);
      }
    });
  }

  generatePageKeyPair(dataArray, callback){
    var privateKey = '';
    var publicKey = '';
    // var that = this;
    for (var i = 0; i < 32; i++){
      if (this.numberOrLetter()){
        privateKey += this.getRandomNumber();
      } else {
        privateKey += this.getRandomLetter(this.upperOrLower());
      }
    }

    for (i = 0; i < 6; i++){
      if (this.numberOrLetter()){
        publicKey += this.getRandomNumber();
      } else {
        publicKey += this.getRandomLetter(this.upperOrLower());
      }
    }

    for (var x = 0; x < dataArray.length; x++){
      var thisObject = dataArray[x];
      if (thisObject != undefined){
        if (thisObject.publicURLSuffix == publicKey){
          this.generatePageKeyPair(dataArray, function(publicKey, privateKey){
            callback(publicKey, privateKey);
          });
        }
      }
    }

    callback(publicKey, privateKey);
    // callback(publicKey, privateKey, undefined);
  }

  numberOrLetter(){
    return Math.floor(Math.random() * 2)
  }

  upperOrLower(){
    return Math.floor(Math.random() * 2)
  }

  getRandomNumber(){
    return Math.floor(Math.random() * 10) + '';
  }

  getRandomLetter(isUpper){
    var randomLetter = Math.floor(Math.random() * 26) + 65;

    if (!isUpper){
      randomLetter += 32;
    }

    return String.fromCharCode(randomLetter);
  }

  uploadPageData(publicKey, uploadData, callback){
    // Hardcoding 100K limit
    var uploadSize = Math.floor((uploadData.length / 1024) * .75);

    if (uploadSize > 100){
      callback(false, new Error("Size exceeds limit"));
    } else {
      var that = this;
      this.mhch.getObjectById("PagesCache", publicKey, function(returnObj, err){
        if (!err){
          returnObj["data"] = uploadData;
          that.mhch.updateObjectById("PagesCache", publicKey, returnObj, function(returnObj, err){
            if (!err){
              callback(true, undefined);
            } else {
              callback(undefined, err);
            }
          });
        } else {
          callback(undefined, err);
        }
      });

    }
  }

  getAttributes(publicKey, callback){
    this.mhch.getObjectById("PagesCache", publicKey, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          var attributeObj = {};
          attributeObj["publicURLSuffix"] = returnObj["returnObj"];
          attributeObj["createdDate"] = returnObj["createdDate"];
          attributeObj["expiration"] = returnObj["expiration"];
          attributeObj["mimetype"] = returnObj["mimetype"];

          if (returnObj["data"] != undefined){
            var dataSize = Math.floor(returnObj["data"].length * .75);

            attributeObj["datasize"] = dataSize;
          }

          callback(attributeObj, undefined);
        } else {
          callback(undefined, undefined);
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  getPageData(publicKey, callback){
    this.mhch.getObjectById("PagesCache", publicKey, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          var attributeObj = {};
          attributeObj["publicURLSuffix"] = returnObj["publicURLSuffix"];

          if (returnObj["data"] != undefined){
            attributeObj["data"] = returnObj["data"];
          }

          callback(attributeObj, undefined);
        } else {
          callback(undefined, undefined);
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  updateAttributes(publicKey, updateJSON, callback){
    var updateExpiration = updateJSON["expiration"];
    var updateMimeType = updateJSON["mimetype"];
    var that = this;
    this.mhch.getObjectById("PagesCache", publicKey, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          if (updateExpiration != undefined){
            returnObj["expiration"] = that.parseExpiration(updateExpiration);
          }
          if (updateMimeType != undefined){
            returnObj["mimetype"] = that.parseMimeType(updateMimeType);
          }

          that.mhch.updateObjectById("PagesCache", publicKey, returnObj, function(returnObj, err){
            if (!err){
              var callbackJSON = {};
              callbackJSON["expiration"] = returnObj["expiration"];
              callbackJSON["mimetype"] = returnObj["mimetype"];

              callback(callbackJSON, undefined);
            } else {
              console.log(err);
              callback(undefined, err);
            }
          });
        } else {
          callback(undefined, err);
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  getNumberOfActivePages(){
    var isWaiting = true;
    var numberOfPages;

    this.mhch.getAllObjects("PagesCache", function(dataArray, err){
      if (!err){
        if (dataArray != undefined){
          numberOfPages = dataArray.length;
        }
        isWaiting = false;
      } else {
        console.log(err);
        isWaiting = false;
      }
    });

    while(isWaiting){

    }

    return numberOfPages;
  }

  validateKeys(publicKey, privateKey, callback){
    this.mhch.getObjectById("PagesCache", publicKey, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          if (returnObj["key"] == privateKey){
            callback(true, undefined);
          } else {
            callback(false, undefined);
          }
        } else {
          callback(undefined, undefined);
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  parseExpiration(expirationValue){
    if (!isNaN.expirationValue){
      if (expirationValue > 604800){
        expirationValue = 604800;
      } else if (expirationValue < 86400){
        expirationValue = 86400;
      }
    } else {
      expirationValue = 604800;
    }

    return expirationValue;
  }

  parseMimeType(mimetypeValue){
    if (mimetypeValue != "text/html" && mimetypeValue != "text/plain" && mimetypeValue != "application/json"){
      mimetypeValue = "text/plain";
    }

    return mimetypeValue;
  }

  loadNotFoundPage (){
    var fs = require("fs");

    var data = fs.readFileSync(this.settings.staticContent + this.settings.notFoundPage);

    return data;
  }
}

module.exports = microhostdata;
