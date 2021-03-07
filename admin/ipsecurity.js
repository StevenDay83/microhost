
class ipSecurity {
  constructor(cachemanager, settings){
    this.ipch = cachemanager;
    this.settings = settings;
  }

  rehashSettings(settings){
    this.settings = settings;
  }

  isEnabled(){
    return this.settings.ipsecurity.enabled;
  }

  blockAction(remoteIPAddress){
    var isWaiting = true;
    var blockActionOnIP = false;
    var that = this;
    this.ipch.getAllObjects("IPSecurityCache", function(blockListArray, err){
      if (!err){
        // Check whitelist

        if (that.inList(remoteIPAddress, blockListArray, true)){
          isWaiting = false;
        } else if (that.inList(remoteIPAddress, blockListArray, false)){
          blockActionOnIP = true;
          isWaiting = false;
        } else {
          // Default to safelist
          isWaiting = false;
        }

      } else {
        console.log(err);
      }
    });

    while (isWaiting){

    }

    return blockActionOnIP;
  }

  inList(remoteIPAddress, blockListArray, isWhiteList){
    var actionable = false;

    for (var i = 0; i < blockListArray.length; i++){
      var thisBlockEntry = blockListArray[i];

      if (thisBlockEntry["action"] == isWhiteList){
        var ipCompare = require('ip');
        var cidrIPAddress = thisBlockEntry["ipAddr"] + '/' + thisBlockEntry["cidr"];

        if (ipCompare.cidrSubnet(cidrIPAddress).contains(remoteIPAddress)){
            actionable = true;
            break;
        }
      }
    }

    return actionable;
  }

  addIPAddrToList(list, ipAddress, cidr, callback){
    var that = this;

    this.ipch.getObjectById("IPSecurityCache", ipAddress, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          callback(returnObj, new Error("Entry already exists"));
        } else {
          var newObject = {
            "ipAddr":ipAddress,
            "cidr":cidr,
            "action":list
          };


          that.ipch.createObject("IPSecurityCache", newObject, function(blockListObject, err){
            if (!err){
              callback(blockListObject, undefined);
            } else {
              callback(undefined, err);
            }
          });
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  updateIPAddrToList(list, ipAddress, cidr, callback){
    var that = this;

    this.ipch.getObjectById("IPSecurityCache", ipAddress, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          // Proceed
          var newObject = {
            "ipAddr":ipAddress,
            "cidr":cidr,
            "action":list
          };

          that.ipch.updateObjectById("IPSecurityCache", ipAddress, newObject, function(updateObj, err){
            if (!err){
              callback(updateObj, undefined);
            } else {
              callback(undefined, err);
            }
          });
        } else {
          callback(undefined, new Error("Entry does not exist"));
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  deleteIPAddrFromList(ipAddress, callback){
    var that = this;

    this.ipch.getObjectById("IPSecurityCache", ipAddress, function(returnObj, err){
      if (!err){
        if (returnObj != undefined){
          that.ipch.deleteObjectById("IPSecurityCache", ipAddress, function(deletedObj, err){
            if (!err){
              callback(deletedObj, undefined);
            } else {
              callback(undefined, err);
            }
          });
        } else {
          callback(undefined, new Error("Entry does not exist"));
        }
      } else {
        callback(undefined, err);
      }
    });
  }

  getIPList(listType, callback){
    try {
      var thisList = [];
      this.ipch.getAllObjects("IPSecurityCache", function(dataArray, err){
        if (!err){
          for (var i = 0; i < dataArray.length; i++){
            var thisItem = dataArray[i];

            if (thisItem != undefined){
              if (thisItem.action == listType){
                var newIPListObject = {};
                newIPListObject["ipAddr"] = thisItem.ipAddr;
                newIPListObject["cidr"] = thisItem.cidr;
                newIPListObject["action"] = thisItem.action;

                thisList.push(newIPListObject);
              }
            }
          }
          callback(thisList, undefined);
        } else {
          callback(undefined, err);
        }
      });
    } catch (err) {
      callback(undefined, err);
    }
  }

  hitIPLimit(remoteIPAddress){
    var pageLimitIP = this.settings.http.limitPerIP;
    var hitIPLimit = false;
    var isWaiting = true;
    var pageIPCount = 0;

    var that = this;
    this.ipch.getAllObjects("PagesCache", function(dataArray, err){
      if (!err){
        for (var i = 0; i < dataArray.length; i++){
            var thisData = dataArray[i];

            if (thisData.ipAddr == remoteIPAddress){
              pageIPCount++;
            }
        }

        if (pageIPCount >= that.settings.http.limitPerIP){
          hitIPLimit = true;
        }
      } else {
        console.log(err);
      }

      isWaiting = false;

    });

    while(isWaiting){

    }

    return hitIPLimit;
  }
}

module.exports = ipSecurity;
