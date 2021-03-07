var apiPrefix =  microhostSettingsJSON.apiPrefix;
var adminPrefix =  microhostSettingsJSON.adminPrefix;

function getSessionIDCookie(cookieString){
  var sessionCookieJSON = {};

  if (cookieString != undefined){
    var cookieArray = cookieString.split(';');

    for (i = 0; i < cookieArray.length; i++){
      var thisCookieArray = cookieArray[i].split('=');

      if (thisCookieArray != undefined){
        thisCookieArray[0] = thisCookieArray[0].replace(new RegExp(' ', "ig"), '');
        if (thisCookieArray[0] == "sessionid"){
          sessionCookieJSON["sessionid"] = thisCookieArray[1];
          break;
        }
      }
    }

    return sessionCookieJSON;
  }
}

function authenticateUser (username, password, callback){
  try {
    if (username != undefined && password != undefined){
      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", apiPrefix + adminPrefix + '/authenticateadmin', true);
      xhttp.setRequestHeader('Content-type','application/json');

      var authenticationJSON = {};
      authenticationJSON["username"] = username;
      authenticationJSON["password"] = password;

      xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
          var loginResults = JSON.parse(xhttp.responseText);

          if (loginResults.auth == true){
            var sessionJSON = {};
            sessionJSON["sessionid"] =  loginResults["sessionid"];

            callback(sessionJSON, undefined);
          } else if (loginResults.auth == "false"){
            callback(undefined, new Error("Login credentials invalid"));
          } else if (loginResults.error != undefined){
            callback(undefined, new Error(loginResults.error));
          } else {
            callback(undefined, new Error("System Error: Please contact administrator"));
          }
        }
      };
      xhttp.send(JSON.stringify(authenticationJSON));
    } else {
      callback(undefined, new Error("Invalid Input"));
    }
  } catch (err){
    callback(undefined, err);
  }
}

function validateSession(sessionId, callback){
  try {
    if (sessionId != undefined){
      var xhttp = new XMLHttpRequest();
      xhttp.open("GET", apiPrefix + adminPrefix + '/validateadmin', true);
      xhttp.setRequestHeader('token',sessionId);

      xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
          var validationResults = JSON.parse(xhttp.responseText);

          if (validationResults.auth == true){
            callback(true, undefined);
          } else if (validationResults.auth == "false"){
            callback(false, undefined);
          } else if (validationResults.error != undefined){
            callback(false, new Error(validationResults.error));
          } else {
            callback(false, new Error("System Error"));
          }
        }
      };
      xhttp.send();
    } else {
      callback(false, new Error("Session empty"));
    }
  } catch (err){
    callback(false, err);
  }
}

function getAdminStatistics(sessionId, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", apiPrefix + adminPrefix + '/getstats', true);
    xhttp.setRequestHeader('token',sessionId);

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var statsJSON = JSON.parse(xhttp.responseText);

        if (statsJSON.auth == "false"){
          callback(undefined, new Error("session id invalid"));
        } else if (statsJSON.error != undefined){
          callback(undefined, new Error(statsJSON.error));
        } else {
          callback(statsJSON, undefined);
        }
      }
    }

    xhttp.send();

  } catch (err){
    console.log(err);
    callback(undefined, err);
  }
}

function getList(sessionId, listType, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", apiPrefix + adminPrefix + '/getiplist?listtype=' + listType, true);
    xhttp.setRequestHeader('token',sessionId);

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var listJSON = JSON.parse(xhttp.responseText);

        if (listJSON.auth == "false"){
          callback(undefined, new Error("session id invalid"));
        } else if (listJSON.error != undefined){
          callback(undefined, new Error(listJSON.error));
        } else {
          callback(listJSON, undefined);
        }
      }
    }

    xhttp.send();

  } catch (err){
    console.log(err);
    callback(undefined, err);
  }
}

function modifyIPToList(sessionId, ipFilterObj, list, action, callback) {
  try {
    var ipActionURL;

    if (action == "add"){
      ipActionURL = apiPrefix + adminPrefix + '/addiptolist';
    } else if (action == "remove"){
      ipActionURL = apiPrefix + adminPrefix + '/deleteipfromlist';
    } else if (action == "update"){
      ipActionURL = apiPrefix + adminPrefix + '/updateiptolist';
    } else {
      callback(new Error("system Error: No action specified"));
      return;
    }

    var newIPObject = {};
    newIPObject["ipaddr"] = ipFilterObj["ipAddr"];
    newIPObject["cidr"] = ipFilterObj["cidr"];
    newIPObject["list"] = list;

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", ipActionURL, true);
    xhttp.setRequestHeader('token',sessionId);
    xhttp.setRequestHeader('Content-type','application/json');



    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var listResponse = JSON.parse(xhttp.responseText);

        if (listResponse.auth == "false"){
          callback(new Error("session id invalid"));
        } else if (listResponse.iplist != undefined){
          if (listResponse.iplist == "success"){
            callback(undefined);
          } else {
            callback(new Error("ip list change failure"));
          }
        } else if (listResponse.error != undefined){
          callback(new Error(listResponse.error));
        } else {
          callback(undefined);
        }
      }
    }
    xhttp.send(JSON.stringify(newIPObject));
  } catch (err) {
    console.log(err);
    callback(err);
  }
}

function logOut(sessionId, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", apiPrefix + adminPrefix + '/logout', true);
    xhttp.setRequestHeader('token',sessionId);
    xhttp.setRequestHeader('Content-type','application/json');

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var logOutResponse = JSON.parse(xhttp.responseText);

        if (logOutResponse.logout == true){
          callback(true, undefined);
        } else if (logOutResponse.logOut == false){
          callback(false, undefined);
        } else {
          if (logOutResponse.error != undefined){
            callback(false, new Error(logOutResponse.error));
          } else {
            callback(false, new Error("Something went wrong"));
          }
        }
      }
    }

    xhttp.send();
  } catch (err){
    callback(false, err);
  }
}
