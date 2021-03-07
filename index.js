var ServerSettings = require("./settings/serversettings");
var cachemanager = require("./cache/cacheManager");
var microhostcache = require("./microhostcachehandlers/microhostpages");
var adminusercache = require("./microhostcachehandlers/adminusercachehandler");
var ipsecuritycache = require("./microhostcachehandlers/ipsecuritycachehandler");
var microhostdata = require("./hosted/microhostdata")
var datamanager = require("./hosted/datamanager");
var ipsecurity = require("./admin/ipsecurity");
var adminmanagement = require("./admin/adminmanager");
var logger = require("./admin/logger");

const settingsFile = "settings.json";

var microhostSettings = new ServerSettings(settingsFile);
var microhostCacheManager = new cachemanager();
var mhLogger;

function initServer() {
  if (microhostSettings.loadSettings()){
    // console.log(microhostSettings.getSettings());

    // Create Caches

    mhLogger = new logger(microhostSettings.getSettingsSection("logging"));
    mhLogger.startLogger();

    mhLogger.logEvent("INFO", "Starting Logging Service");

    var microhostPagesCacheHandler = new microhostcache(microhostSettings.getSettingsSection("database"), function(){
      microhostCacheManager.createCache("PagesCache", microhostPagesCacheHandler, "publicURLSuffix");

      microhostCacheManager.initializeCache("PagesCache", function(err){
        if (err){
          console.log(err);
          mhLogger.logEvent("ERROR", err.message);

        } else {
          mhLogger.logEvent("INFO", "Initialized Pages Cache Data");

          startAPIServer();
          // var obj1 = microhostCacheManager.getAllObjects("PagesCache", function (dataArray, err){
          // console.log(dataArray);
          //
          // });
        }
      });
    });

    var adminUserCacheHandler = new adminusercache(microhostSettings.getSettingsSection("database"), function(){
      microhostCacheManager.createCache("AdminUserCache", adminUserCacheHandler, "username", false);

      microhostCacheManager.initializeCache("AdminUserCache", function(err){
        if (err){
          console.log(err);
        } else {
          mhLogger.logEvent("INFO", "Initialized Administrative Cache Data");

          microhostCacheManager.createCache("AdminSessionCache", undefined, "sessionid", true);
          // microhostCacheManager.getAllObjects("AdminUserCache", function(dataArray, err){
          //   if (!err){
          //     console.log(dataArray);
          //   } else {
          //     console.log(err);
          //   }
          // });
        }
      });
    });

    var ipSecurityCacheHandler = new ipsecuritycache(microhostSettings.getSettings(), function(){
      microhostCacheManager.createCache("IPSecurityCache", ipSecurityCacheHandler, "ipAddr", false);

      microhostCacheManager.initializeCache("IPSecurityCache", function(err){
        if (err){
          console.log(err);
        } else {
          microhostCacheManager.getAllObjects("IPSecurityCache", function(dataArray, err){
            if (err){
              console.log(err);
            }
          });
        }
      });
    });




  } else {
    console.log(new Error("Error loading settings! Aborting..."));
    process.exit(1);
  }
}

function startAPIServer(){
  var express = require('express');
  var apiServerSettings = microhostSettings.getSettingsSection("server");
  var httpServerSettings = microhostSettings.getSettingsSection("http");
  var apiPrefix = httpServerSettings.apiPrefix;
  var pagePrefix = httpServerSettings.pagePrefix;
  var adminPrefix = httpServerSettings.apiPrefix + httpServerSettings.adminPrefix;
  var microhostWebApp = express();
  var microhostdataserver = new microhostdata(microhostCacheManager, httpServerSettings);
  var dataExpManager = new datamanager(microhostCacheManager);
  var ipSecurityBlocker = new ipsecurity(microhostCacheManager, microhostSettings.getSettings());
  var adminUserManager = new adminmanagement(microhostCacheManager, microhostSettings.getSettings());

  dataExpManager.initalizePageExpirationWatch();

  mhLogger.logEvent("INFO", "Starting API Server");


  // microhostCacheManager.deleteObjectById("PagesCache", "m2LJHo", function(a, b){
  //   console.log(a);
  // });

  // microhostWebApp.setHeader("X-Powered-By", 'microhost');
  microhostWebApp.enable('trust proxy');

  microhostWebApp.listen(apiServerSettings.port, apiServerSettings.hostname, function() {
    // console.log("Server started on port " + apiServerSettings.port);
    mhLogger.logEvent("INFO", "Server started on port " + apiServerSettings.port);

  });

  microhostWebApp.get(apiPrefix + '/test', function(req, res){
    res.send("Test!");
  });

  // Load page
  microhostWebApp.get('/p/:urlkey', function(req, res){
    var urlKey = req.params.urlkey;
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    microhostdataserver.loadPageContent(urlKey, function(pageData, mimetype, err){
      var resStatus;
      if (err){
        res.status(404);
        resStatus = "404";
      } else {
        res.status(200);
        resStatus = "200";
      }



      mhLogger.logEvent("ACCESS", ipAddress + " - Page " + urlKey + " accessed - " + resStatus);

      res.set('Content-Type', mimetype);
      res.send(pageData);
    });

    // res.send("Test!");
  });

  microhostWebApp.post(apiPrefix + '/createpage', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var buffer = '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        var jsonRequest = JSON.parse(buffer);

        // parameters
        // expiration: up to 604800 (1 week)
        // mimetype: text/html, text/plain, application/json

        // Reserve here for blocklist

        // Proceeding

        // ipSecurityBlocker.blockAction("38.9.211.15")

        if (microhostdataserver.getNumberOfActivePages() > httpServerSettings.pagelimit){
          var pageLimitJSON = {};
          pageLimitJSON["error"] = "Page limit capacity exceeded";

          res.end(JSON.stringify(pageLimitJSON));
        } else if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
          var ipBlockedJSON = {
            "error":"IP Blocked"
          };

          mhLogger.logEvent("INFO", "IP " + ipAddress + " blocked in blocklist");


          res.end(JSON.stringify(ipBlockedJSON));
        } else if (ipSecurityBlocker.hitIPLimit(ipAddress)) {
          var ipLimitJSON = {
            "error":"IP Limit reached"
          };

          mhLogger.logEvent("INFO", "IP limit reached for " + ipAddress);

          res.end(JSON.stringify(ipLimitJSON));
        } else {
          var expiration = jsonRequest["expiration"];
          var mimetype = jsonRequest["mimetype"];
          jsonRequest["ipAddr"] = ipAddress;

          if (expiration != undefined && mimetype != undefined){
            microhostdataserver.createPageEntry(jsonRequest, function(keyJSON, err){
              if (err){
                console.log(err);
              } else {
                keyJSON["status"] = 'ok';

                mhLogger.logEvent("INFO", "Site " + keyJSON.publicURLSuffix + " created by " + ipAddress);

                res.end(JSON.stringify(keyJSON));
              }
            });
          } else {
            var invalidInput = {
              "error":"Invalid Input"
            };

            mhLogger.logEvent("ERROR", "Error reported: " + err.message);


            res.end(JSON.stringify(invalidInput));
          }
        }
      } catch (err){
        console.log(err);
        var invalidInput = {
          "error":"Invalid Input"
        };

        mhLogger.logEvent("ERROR", "Error reported: " + err.message);

        res.end(JSON.stringify(invalidInput));
      }
    });
  });

  microhostWebApp.post(apiPrefix + '/uploaddata', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var buffer = '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        var uploadJSON = JSON.parse(buffer);

        var publicURLSuffix = uploadJSON["publicURLSuffix"];
        var privateKey = uploadJSON["privateKey"];
        var uploadData = uploadJSON["data"];

        if (publicURLSuffix != undefined || privateKey != undefined || uploadData != undefined){
          microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
            if (!err){
              if (isValid){
                // uploadPageData()
                microhostdataserver.uploadPageData(publicURLSuffix, uploadData, function(isSuccess, err){
                  if (!err){
                    if (isSuccess){
                      var successJSON = {
                        "upload":"success"
                      };

                      mhLogger.logEvent("INFO", "Data updated for site " + publicURLSuffix + " by " + ipAddress);

                      res.end(JSON.stringify(successJSON));
                    }
                  } else {
                    if (isSuccess == false){
                      var failureJSON = {
                        "upload":"failed",
                        "error":err.message
                      };

                      mhLogger.logEvent("ERROR", "Data updated FAILED for site " + publicURLSuffix + " by " + ipAddress + " - Error: " + err.message);

                      res.end(JSON.stringify(failureJSON));
                    } else {
                      console.log(err);
                      var failureJSON = {
                        "upload":"failed",
                        "error":"system error"
                      };

                      mhLogger.logEvent("ERROR", "Data updated FAILED for site " + publicURLSuffix + " by " + ipAddress + " - Error: System Error");

                      res.end(JSON.stringify(failureJSON));
                    }
                  }
                });
              } else {
                var invalidAuth = {
                  "auth":"false"
                };

                mhLogger.logEvent("ERROR", "Data updated FAILED for site " + publicURLSuffix + " by " + ipAddress + " - Error: Authentication error");

                res.end(JSON.stringify(invalidAuth));
              }
            } else {
              var invalidInput = {
                "error":"Invalid Input"
              };

              mhLogger.logEvent("ERROR", "Data updated FAILED for site " + publicURLSuffix + " by " + ipAddress + " - Error: Invalid input");

              res.end(JSON.stringify(invalidInput));
            }
          });
        } else {
          var invalidInput = {
            "error":"Invalid Input"
          };

          mhLogger.logEvent("ERROR", "Data updated FAILED by " + ipAddress + " - Error: Invalid input");

          res.end(JSON.stringify(invalidInput));
        }

      } catch (err){
        console.log(err);
        var invalidInput = {
          "error":"Invalid Input"
        };

        mhLogger.logEvent("ERROR", "Data updated FAILED by " + ipAddress + " - Error: " + err.message);

        res.end(JSON.stringify(invalidInput));
      }
    });

  });

  microhostWebApp.post(apiPrefix + '/validate', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var buffer = '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        var validateJSON = JSON.parse(buffer);

        var publicURLSuffix = validateJSON["publicURLSuffix"];
        var privateKey = validateJSON["privateKey"];

        microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
          if (!err){
            var authJSON = {};

            if (isValid){
              authJSON["auth"] = "success";
            } else {
              authJSON["auth"] = "false";
            }
            res.end(JSON.stringify(authJSON));
          } else {
            console.log(err);
            var invalidInput = {
              "error":"Invalid Input"
            };

            res.end(JSON.stringify(invalidInput));
          }
        });
      } catch (err){
        console.log(err);
        var invalidInput = {
          "error":"Invalid Input"
        };

        res.end(JSON.stringify(invalidInput));
      }
    });
  });

  microhostWebApp.post(apiPrefix + '/updatepageattributes', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);

    var buffer = '';
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        var updateJSON = JSON.parse(buffer);

        var publicURLSuffix = updateJSON["publicURLSuffix"];
        var privateKey = updateJSON["privateKey"];

        microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
          if (!err){

            if (isValid){
              // Update expiration and/or mime/type

              var updatePageAttributes = {};
              updatePageAttributes["expiration"] = updateJSON["expiration"];
              updatePageAttributes["mimetype"] = updateJSON["mimetype"];

              microhostdataserver.updateAttributes(publicURLSuffix, updatePageAttributes, function(returnObj, err){
                if (!err){
                  returnObj["update"] = "success";

                  res.end(JSON.stringify(returnObj));
                } else {
                  console.log(err);
                  var updateFail = {
                    "update":"failed"
                  };

                  res.end(JSON.stringify(updateFail));
                }
              });
            } else {
              var authJSON = {};
              authJSON["auth"] = "false";
              res.end(JSON.stringify(authJSON));
            }
          } else {
            console.log(err);
            var invalidInput = {
              "error":"Invalid Input"
            };

            res.end(JSON.stringify(invalidInput));
          }
        });

      } catch (err){
        console.log(err);
        var invalidInput = {
          "error":"Invalid Input"
        };

        res.end(JSON.stringify(invalidInput));
      }
    });
  });

  microhostWebApp.get(apiPrefix + '/getpageattributes', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var publicURLSuffix = req.query["publickey"];
    var privateKey = req.query["privatekey"];

    if (publicURLSuffix != undefined && privateKey != undefined){
      microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
        if (!err){
          if (isValid){
            microhostdataserver.getAttributes(publicURLSuffix, function(attributeObj, err){
              if (!err){
                if (attributeObj != undefined){
                  res.end(JSON.stringify(attributeObj));
                } else {
                  var failureJSON = {
                    "error":"object not found"
                  };
                  res.end(JSON.stringify(failureJSON));
                }

              } else {
                console.log(err);

                var failureJSON = {
                  "error":"system error"
                };
                res.end(JSON.stringify(failureJSON));
              }
            });
          } else {
            var authJSON = {};
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        } else {
          console.log(err);

          var invalidInput = {
            "error":"Invalid Input"
          };

          res.end(JSON.stringify(invalidInput));
        }
      });
    } else {
      var invalidInput = {
        "error":"Invalid Input"
      };

      res.end(JSON.stringify(invalidInput));
    }
  });

  microhostWebApp.get(apiPrefix + '/getpagedata', function(req, res){
    // httpServerSettings.poweredBy
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var publicURLSuffix = req.query["publickey"];
    var privateKey = req.query["privatekey"];

    if (publicURLSuffix != undefined && privateKey != undefined){
      microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
        if (!err){
          if (isValid){
            // GetPageData
            microhostdataserver.getPageData(publicURLSuffix, function(attributeObj, err){
              if (!err){
                if (attributeObj != undefined){
                  res.end(JSON.stringify(attributeObj));
                } else {
                  var failureJSON = {
                    "error":"object not found"
                  };
                  res.end(JSON.stringify(failureJSON));
                }

              } else {
                console.log(err);

                var failureJSON = {
                  "error":"system error"
                };
                res.end(JSON.stringify(failureJSON));
              }
            });

          } else {
            var authJSON = {};
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        } else {
          console.log(err);

          var invalidInput = {
            "error":"Invalid Input"
          };

          res.end(JSON.stringify(invalidInput));
        }
      });
    } else {
      var invalidInput = {
        "error":"Invalid Input"
      };

      res.end(JSON.stringify(invalidInput));
    }
  });


  microhostWebApp.get(apiPrefix + '/deletepage', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    var publicURLSuffix = req.query["publickey"];
    var privateKey = req.query["privatekey"];

    if (publicURLSuffix != undefined && privateKey != undefined){
      microhostdataserver.validateKeys(publicURLSuffix, privateKey, function(isValid, err){
        if (!err){
          if (isValid){
            // DeletePageData
            microhostdataserver.deletePage(publicURLSuffix, function(deletedObj, err){
              if (!err){
                var successJSON = {
                  "delete":"success",
                  "publicURLSuffix":publicURLSuffix
                };

                mhLogger.logEvent("INFO", "Site " + publicURLSuffix + " deleted by " + ipAddress);

                res.end(JSON.stringify(successJSON));
              } else {
                console.log(err);

                var failureJSON = {
                  "error":"system error"
                };
                res.end(JSON.stringify(failureJSON));
              }
            });

          } else {
            var authJSON = {};
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        } else {
          console.log(err);

          var invalidInput = {
            "error":"Invalid Input"
          };

          res.end(JSON.stringify(invalidInput));
        }
      });
    } else {
      var invalidInput = {
        "error":"Invalid Input"
      };

      res.end(JSON.stringify(invalidInput));
    }
  });

  microhostWebApp.post(apiPrefix + '/blockip', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var buffer = '';

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {

      } catch (err){

      }
    });
  });

  microhostWebApp.post(adminPrefix + '/authenticateadmin', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var buffer = '';

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
          var ipBlockedJSON = {
            "error":"IP Blocked"
          };

          res.end(JSON.stringify(ipBlockedJSON));
        } else {
          // Proceed

          var adminCredentials = JSON.parse(buffer);
          var username = adminCredentials["username"];
          var password = adminCredentials["password"];

          if (username != undefined && password != undefined){
            adminUserManager.authenticateUser(username, password, function(isAuth, err){
              if (!err){
                var authJSON = {};

                if (isAuth){
                  authJSON["auth"] = true;

                  adminUserManager.createSession(username, function(sessionObj, err){
                    if (!err){
                      authJSON["sessionid"] = sessionObj["sessionid"];
                    } else {
                      console.log(err);
                      authJSON["auth"] = "false";
                    }
                  });

                } else {
                  authJSON["auth"] = "false";
                }
                res.end(JSON.stringify(authJSON));
              } else {
                var failureJSON = {
                  "error":"system error"
                };
                res.end(JSON.stringify(failureJSON));
              }
            });
          } else {
            var invalidInput = {
              "error":"Invalid Input"
            };

            res.end(JSON.stringify(invalidInput));
          }
        }
      } catch (err){
        console.log(err);

        var invalidInput = {
          "error":"Invalid Input"
        };

        res.end(JSON.stringify(invalidInput));
      }
    });
  });

  microhostWebApp.get(adminPrefix + '/validateadmin', function(req, res){
    res.set('Content-Type', 'application/json');
    var authToken = req.headers['token'];
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var authJSON = {};
    authJSON["auth"] = "false";

    if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
      var ipBlockedJSON = {
        "error":"IP Blocked"
      };

      res.end(JSON.stringify(ipBlockedJSON));
    } else {
      if (authToken == undefined){
        res.end(JSON.stringify(authJSON));
      } else {
        adminUserManager.getSessionById(authToken, function(sessionObj, err){
          if (!err){
            if (sessionObj != undefined){
              authJSON["auth"] = true;
            }
          }
          res.end(JSON.stringify(authJSON));
        });
      }
    }

  });

  microhostWebApp.post(adminPrefix + '/addiptolist', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var buffer = '';
    var authToken = req.headers['token'];
    var authJSON = {};

    req.on('data', function(inData){
      buffer += inData;
    });

    req.on('end', function(){
      try {
        var ipListObj = JSON.parse(buffer);

        if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
          var ipBlockedJSON = {
            "error":"IP Blocked"
          };

          res.end(JSON.stringify(ipBlockedJSON));
        } else {
          if (adminUserManager.isSessionValid(authToken)){

            var listType = ipListObj["list"];
            var ipAddressForList = ipListObj["ipaddr"];
            var cidr = ipListObj["cidr"];

            if (ipAddressForList != undefined){
              if (ipAddressForList.split('.').length != 4){
                var invalidInput = {
                  "error":"Invalid Input"
                };

                res.end(JSON.stringify(invalidInput));
              }
            } else {
              var invalidInput = {
                "error":"Invalid Input"
              };

              res.end(JSON.stringify(invalidInput));
            }

            if (listType == undefined || (listType > 1 || listType < 0)){
              listType = 0; // block list default
            }

            if (cidr == undefined || (cidr > 32 || cidr < 0)){
              cidr = 32; // Assume single ip address if input is junk or omitted
            }

            ipSecurityBlocker.addIPAddrToList(listType, ipAddressForList, cidr, function(newObject, err){
              if (!err){
                var successJSON = {};
                successJSON["iplist"] = "success";

                res.end(JSON.stringify(successJSON));
              } else {
                if (err.message == "Entry already exists"){
                  var errorJSON = {
                    "error":err.message
                  };

                  res.end(JSON.stringify(errorJSON));
                } else {
                  console.log(err);

                  var failureJSON = {
                    "error":"system error"
                  };
                  res.end(JSON.stringify(failureJSON));
                }
              }
            });

          } else {
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        }
      } catch(err){
        console.log(err);
        var failureJSON = {
          "error":"system error"
        };
        res.end(JSON.stringify(failureJSON));
      }

    });

  });

  microhostWebApp.post(adminPrefix + '/updateiptolist', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var buffer = '';
    var authToken = req.headers['token'];
    var authJSON = {};

    req.on('data', function(inData){
        buffer += inData;
    });

    req.on('end', function(){
      try {
        var ipListObj = JSON.parse(buffer);

        if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
          var ipBlockedJSON = {
            "error":"IP Blocked"
          };

          res.end(JSON.stringify(ipBlockedJSON));
        } else {
          if (adminUserManager.isSessionValid(authToken)){

            var listType = ipListObj["list"];
            var ipAddressForList = ipListObj["ipaddr"];
            var cidr = ipListObj["cidr"];

            if (ipAddressForList != undefined){
              if (ipAddressForList.split('.').length != 4){
                var invalidInput = {
                  "error":"Invalid Input"
                };

                res.end(JSON.stringify(invalidInput));
              }
            } else {
              var invalidInput = {
                "error":"Invalid Input"
              };

              res.end(JSON.stringify(invalidInput));
            }

            if (listType == undefined || (listType > 1 || listType < 0)){
              listType = 0; // block list default
            }

            if (cidr == undefined || (cidr > 32 || cidr < 0)){
              cidr = 32; // Assume single ip address if input is junk or omitted
            }

            ipSecurityBlocker.updateIPAddrToList(listType, ipAddressForList, cidr, function(updatedObj, err){
              if (!err){
                var successJSON = {};
                successJSON["iplist"] = "success";

                res.end(JSON.stringify(successJSON));
              } else {
                if (err.message == "Entry does not exist"){
                  var errorJSON = {
                    "error":err.message
                  };

                  res.end(JSON.stringify(errorJSON));
                } else {
                  console.log(err);

                  var failureJSON = {
                    "error":"system error"
                  };
                  res.end(JSON.stringify(failureJSON));
                }
              }
            });
          } else {
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        }
      } catch (err) {
        console.log(err);
        var failureJSON = {
          "error":"system error"
        };
        res.end(JSON.stringify(failureJSON));
      }
    });
  });

  microhostWebApp.post(adminPrefix + '/deleteipfromlist', function(req, res){
    res.set('Content-Type', 'application/json');
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var buffer = '';
    var authToken = req.headers['token'];
    var authJSON = {};

    req.on('data', function(inData){
        buffer += inData;
    });

    req.on('end', function(){
      try {
        var ipListObj = JSON.parse(buffer);

        if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
          var ipBlockedJSON = {
            "error":"IP Blocked"
          };

          res.end(JSON.stringify(ipBlockedJSON));
        } else {
          if (adminUserManager.isSessionValid(authToken)){

            var ipAddressForList = ipListObj["ipaddr"];

            if (ipAddressForList != undefined){
              if (ipAddressForList.split('.').length != 4){
                var invalidInput = {
                  "error":"Invalid Input"
                };

                res.end(JSON.stringify(invalidInput));
              }
            } else {
              var invalidInput = {
                "error":"Invalid Input"
              };

              res.end(JSON.stringify(invalidInput));
            }

            ipSecurityBlocker.deleteIPAddrFromList(ipAddressForList, function(deletedObj, err){
              if (!err){
                var successJSON = {};
                successJSON["iplist"] = "success";

                res.end(JSON.stringify(successJSON));
              } else {
                if (err.message == "Entry does not exist"){
                  var errorJSON = {
                    "error":err.message
                  };

                  res.end(JSON.stringify(errorJSON));
                } else {
                  console.log(err);

                  var failureJSON = {
                    "error":"system error"
                  };
                  res.end(JSON.stringify(failureJSON));
                }
              }
            });
          } else {
            authJSON["auth"] = "false";
            res.end(JSON.stringify(authJSON));
          }
        }
      } catch (err) {
        console.log(err);
        var failureJSON = {
          "error":"system error"
        };
        res.end(JSON.stringify(failureJSON));
      }
    });
  });

  microhostWebApp.get(adminPrefix + '/getiplist', function(req, res){
    try {
      res.set('Content-Type', 'application/json');
      var authToken = req.headers['token'];
      res.set("X-Powered-By", httpServerSettings.poweredBy);
      var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      var authJSON = {};
      authJSON["auth"] = "false";

      var listType = req.query["listtype"];

      if (listType == undefined){
        listType = 0;
      }

      if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
        var ipBlockedJSON = {
          "error":"IP Blocked"
        };

        res.end(JSON.stringify(ipBlockedJSON));
      } else {
        if (authToken == undefined){
          res.end(JSON.stringify(authJSON));
        } else if (!adminUserManager.isSessionValid(authToken)){
          res.end(JSON.stringify(authJSON));
        } else {
          ipSecurityBlocker.getIPList(listType, function(listArray, err){
            if (!err){
              res.end(JSON.stringify(listArray));
            } else {
              console.log(err);
              var failureJSON = {
                "error":"cannot retrieve list"
              };
              res.end(JSON.stringify(failureJSON));
            }
          });
        }
      }
    } catch (err) {
      console.log(err);
      var failureJSON = {
        "error":"system error"
      };
      res.end(JSON.stringify(failureJSON));
    }
  });

  microhostWebApp.get(adminPrefix + '/getstats', function(req, res) {
    res.set('Content-Type', 'application/json');
    var authToken = req.headers['token'];
    res.set("X-Powered-By", httpServerSettings.poweredBy);
    var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var authJSON = {};
    authJSON["auth"] = "false";

    if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
      var ipBlockedJSON = {
        "error":"IP Blocked"
      };

      res.end(JSON.stringify(ipBlockedJSON));
    } else {
      if (authToken == undefined){
        res.end(JSON.stringify(authJSON));
      } else {
        if (!adminUserManager.isSessionValid(authToken)){
          authJSON["auth"] = "false";
          res.end(JSON.stringify(authJSON));
        } else {
          // Get status on
          // Number of sites created
          // Sites created in past 10 minutes
          // Individual IP addresses
          var microhoststats = require("./hosted/stats");
          var adminStats = new microhoststats(microhostCacheManager);

          adminStats.getNumberOfActivePages(function(pageCountNumber, err){
            if (!err){
              var timeNow = new Date();
              var oneWeekAgo = new Date(timeNow.getTime() - 86400000);
              adminStats.getSitesCreatedInTime(oneWeekAgo, timeNow, function(createdPagesNumber, err){
                if (!err){
                  adminStats.getIndividualIPAddresses(function(individualPagesNumber, err){
                    var statsJSON = {};
                    statsJSON["activePages"] = pageCountNumber;
                    statsJSON["createdPagesPastDay"] = createdPagesNumber;
                    statsJSON["individualIPAddresses"] = individualPagesNumber;

                    res.end(JSON.stringify(statsJSON));
                  });
                } else {
                  console.log(err);
                  var failureJSON = {
                    "error":"system error"
                  };
                  res.end(JSON.stringify(failureJSON));
                }
              });
            } else {
              console.log(err);
              var failureJSON = {
                "error":"system error"
              };
              res.end(JSON.stringify(failureJSON));
            }
          });
        }
      }
    }
  });

  microhostWebApp.get(adminPrefix + '/logout', function(req, res){
    try {
      res.set('Content-Type', 'application/json');
      var authToken = req.headers['token'];
      res.set("X-Powered-By", httpServerSettings.poweredBy);
      var ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      var logoutJSON = {};

      if (ipSecurityBlocker.isEnabled() && ipSecurityBlocker.blockAction(ipAddress)){
        var ipBlockedJSON = {
          "error":"IP Blocked"
        };

        res.end(JSON.stringify(ipBlockedJSON));
      } else {
        if (authToken == undefined){
          logoutJSON["logout"] = false;

          res.end(JSON.stringify(logoutJSON));
        } else {
          adminUserManager.deleteSession(authToken, function(sessionObj, err){
            if (!err){
              if (sessionObj != undefined){
                logoutJSON["logout"] = true;
              } else {
                logoutJSON["logout"] = false;
              }
              res.end(JSON.stringify(logoutJSON));
            } else {
              console.log(err);
              var failureJSON = {
                "error":"system error"
              };
              res.end(JSON.stringify(failureJSON));
            }
          });
        }
      }
    } catch (err) {
      console.log(err);
      var failureJSON = {
        "error":"system error"
      };
      res.end(JSON.stringify(failureJSON));
    }
  });
}

initServer();
