
class adminManager {
  constructor(cachemanager, settings){
    this.acm = cachemanager;
    this.settings = settings;
    setInterval(this.checkSessionExpirations.bind(this), 60000);
  }

  rehashSettings(settings){
    this.settings = settings;
  }

  authenticateUser(username, password, callback){
    username = username.toLowerCase();
    var that = this;

    this.acm.getObjectById("AdminUserCache", username, function(userObj, err){
      if (!err){
        if (userObj != undefined){
          var passwordHash = that.convertPasswordToSHA512(password);
          if (passwordHash == userObj["password"]){
            callback(true, undefined);
          } else {
            callback(false, undefined);
          }
        } else {
          callback(false, undefined);
        }
      } else {
        callback(false, err);
      }
    });
  }

  getAdminUser(username, callback){
    username = username.toLowerCase();
    var that = this;

    this.acm.getObjectById("AdminUserCache", username, function(userObj, err){
      if (!err){
        callback(userObj, undefined);
      } else {
        callback(undefined, err);
      }
    });
  }

  changeAdminUserAttributes(username, updateJSON, callback){

  }

  removeAdminAccount(username, callback){

  }

  createSession(username, callback){
    var that = this;

    this.acm.getObjectById("AdminUserCache", username, function(userObj, err){
      if (!err){
        that.acm.getAllObjects("AdminSessionCache", function(dataArray, err){
          if (!err){
            that.generateSessionId(dataArray, function(sessionKey){
              var timestamp = new Date();
              var newSessionObject = {
                "sessionid":sessionKey,
                "username":userObj.username,
                "logintime":timestamp.toISOString()
              };

              that.acm.createObject("AdminSessionCache", newSessionObject, function(returnObj, err){
                if (!err){
                  console.log("Session Object");
                  console.log(returnObj);
                  callback(returnObj, undefined);
                } else {
                  callback(undefined, err);
                }
              });
            });

          } else {
            console.log(err);
            callback(undefined, err);
          }
        });
      } else {
        callback(undefined, err);
      }
    });
  }

  getSessionById(sessionId, callback){
    this.acm.getObjectById("AdminSessionCache", sessionId, function(sessionObj, err){
      if (!err){
        callback(sessionObj, undefined);
      } else {
        callback(undefined, err);
      }
    });
  }

  isSessionValid(sessionId){
    var isWaiting = true;
    var isValid = false;

    this.getSessionById(sessionId, function(sessionObj, err){
      if (!err){
        if (sessionObj != undefined){
          isValid = true;
        }
        isWaiting = false;
      } else {
        isWaiting = false;
      }
    });

    while(isWaiting){

    }

    return isValid;
  }

  deleteSession(sessionId, callback){
    var that = this;

    this.acm.getObjectById("AdminSessionCache", sessionId, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          that.acm.deleteObjectById("AdminSessionCache", sessionId, function(deleteObj, err){
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

  checkSessionExpirations(){
    var that = this;

    this.acm.getAllObjects("AdminSessionCache", function(dataArray, err){
      var removeArray = [];
      if (!err){
        for (var i = 0; i < dataArray.length; i++){
          var thisLoginTime = new Date(dataArray[i].logintime);
          var timeNow = new Date();
          var timeOut = that.settings.admin.sessionTimeout * 60 * 1000;

          if ((timeNow.getTime() - thisLoginTime.getTime()) >= timeOut){
            removeArray.push(dataArray[i].sessionid);
          }
        }

        for (var x = 0; x < removeArray.length; x++){
          var removeEntry = removeArray[x];

          that.acm.deleteObjectById("AdminSessionCache", removeEntry, function(deleteObj, err){
            if (!err){
              console.log("Removed expirated session " + deleteObj.sessionid);
            } else {
              console.log(err);
            }
          });
        }
      } else {
        console.log(err);
      }
    });
  }

  generateSessionId(dataArray, callback){
    // num or letter / upper or lower Math.floor(Math.random() * 2)
    // random number Math.floor(Math.random() * 10) + ''
    // randomLetter = Math.floor(Math.random() * 26) + 65
    var sessionIdString = '';

    for (var i = 0; i < 64; i++){
      var numberOrLetter = Math.floor(Math.random() * 2);
      var upperOrLower = Math.floor(Math.random() * 2);
      var randomLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
      var randomNumber = Math.floor(Math.random() * 10) + '';

      if (numberOrLetter){
        // True is Number
        sessionIdString += randomNumber;
      } else {
        if (upperOrLower){
          // True is upper
          sessionIdString += randomLetter.toUpperCase();
        } else {
          sessionIdString += randomLetter.toLowerCase();
        }
      }
    }

    for (var i = 0; i < dataArray.length; i++){
      var thisData = dataArray[i];

      if (thisData != undefined){
        if (thisData.sessionid == sessionIdString){
          this.generateSessionId(dataArray, function(sessionKey){
            callback(sessionKey);
          });
        }
      }
    }

    callback(sessionIdString);
  }

  convertPasswordToSHA512(pText){
    var sha512 = require('crypto-js/sha512');
    var saltedPassword = sha512(pText).toString();
    saltedPassword = saltedPassword.toUpperCase();

    return saltedPassword;
  }


}

module.exports = adminManager;
