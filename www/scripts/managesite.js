function validateKeyLogin(publicKey, privateKey, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", microhostSettingsJSON.apiPrefix + '/validate', true);
    xhttp.setRequestHeader('Content-type','application/json');

    var validateJSON = {};
    validateJSON["publicURLSuffix"] = publicKey;
    validateJSON["privateKey"] = privateKey;

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var results = JSON.parse(xhttp.responseText);

        if (results["auth"] == "success"){
          callback(validateJSON, undefined);
        } else if (results["auth"] == "false"){
          callback(undefined, new Error("Not Authorized"));
        } else if (results["error"] == "Invalid Input"){
          callback(undefined, new Error("Invalid Input"));
        } else {
          callback(undefined, new Error("System Error"));
        }
      }
    }
    xhttp.send(JSON.stringify(validateJSON))
  } catch (err){
    console.log(err);
    callback(undefined, err);
  }

}

function loadAttributes(publicKey, privateKey, callback){
  try {
    var urlString = '/getpageattributes?publickey=' + publicKey + "&privatekey=" +  privateKey;
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", microhostSettingsJSON.apiPrefix + urlString, true);
    xhttp.setRequestHeader('Content-type','application/json');

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var pageAttributesJSON = JSON.parse(xhttp.responseText);

        if (pageAttributesJSON["auth"] == "false"){
          callback(undefined, new Error("Not Authorized"));
        } else if (pageAttributesJSON["error"] != undefined){
          callback(undefined, new Error(pageAttributesJSON["error"]));
        } else {
          callback(pageAttributesJSON, undefined);
        }
      }
    }

    xhttp.send();
  } catch (err){
    console.log(err);
    callback(undefined, err);
  }
}

function updateAttributes(publicKey, privateKey, expiration, mimeType, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", microhostSettingsJSON.apiPrefix + '/updatepageattributes', true);
    xhttp.setRequestHeader('Content-type','application/json');

    var pageAttributesJSON = {};
    pageAttributesJSON["publicURLSuffix"] = publicKey;
    pageAttributesJSON["privateKey"] = privateKey;
    pageAttributesJSON["mimetype"] = mimeType;
    pageAttributesJSON["expiration"] = expiration;

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var resultsJSON = JSON.parse(xhttp.responseText);

        if (resultsJSON["update"] == "success"){
          callback(resultsJSON, undefined);
        } else if (resultsJSON["update"] == "failed"){
          callback(undefined, new Error("Update Failed"));
        } else if (resultsJSON["auth"] == "false"){
          callback(undefined, new Error("Not Authorized"));
        } else if (resultsJSON["error"] != undefined){
          callback(undefined, new Error(resultsJSON["error"]));
        } else {
          callback(undefined, new Error("System Error"));
        }
      }
    }

    xhttp.send(JSON.stringify(pageAttributesJSON));

  } catch (err){
    console.log(err);
    callback(undefined, err);
  }
}

function updatePageData(publicKey, privateKey, data, callback){
  try {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", microhostSettingsJSON.apiPrefix + '/uploaddata', true);
    xhttp.setRequestHeader('Content-type','application/json');

    // var dataEncodedB64 = btoa(unescape(encodeURIComponent(data)));
    var dataEncodedB64 = btoa((encodeURIComponent(data).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    })));
    var dataUploadJSON = {};
    dataUploadJSON["publicURLSuffix"] = publicKey;
    dataUploadJSON["privateKey"] = privateKey;
    dataUploadJSON["data"] = dataEncodedB64;

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var resultsJSON = JSON.parse(xhttp.responseText);

        if (resultsJSON["upload"] == "success"){
          callback(dataUploadJSON, undefined);
        } else if (resultsJSON["upload"] == "failed"){
          callback(undefined, new Error("upload failed"));
        } else if (resultsJSON["auth"] == "false"){
          callback(undefined, new Error("Not Authorized"));
        } else if (resultsJSON["error"] != undefined){
          callback(undefined, new Error(resultsJSON["error"]));
        } else {
          callback(undefined, new Error("System Error"));
        }
      }
    }

    xhttp.send(JSON.stringify(dataUploadJSON));
  } catch(err){
    console.log(err);
    callback(undefined, err);
  }
}

function loadPageData(publicKey, privateKey, callback){
  try {
    var urlString = '/getpagedata?publickey=' + publicKey + "&privatekey=" +  privateKey;
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", microhostSettingsJSON.apiPrefix + urlString, true);
    xhttp.setRequestHeader('Content-type','application/json');

    xhttp.onreadystatechange = function(){
      if (xhttp.readyState == 4 && xhttp.status == 200){
        var pageDataJSON = JSON.parse(xhttp.responseText);

        if (pageDataJSON["auth"] == "false"){
          callback(undefined, new Error("Not Authorized"));
        } else if (pageDataJSON["error"] != undefined){
          callback(undefined, new Error(pageDataJSON["error"]));
        } else {
          if (pageDataJSON["data"] != undefined){
            // pageDataJSON["data"] = atob(decodeURIComponent(escape(pageDataJSON["data"])));
            // pageDataJSON["data"] = atob(pageDataJSON["data"]);
            pageDataJSON["data"] = decodeURIComponent(atob(pageDataJSON["data"]).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            console.log(pageDataJSON["data"]);
          }

          callback(pageDataJSON, undefined);
        }
      }
    }

    xhttp.send();
  } catch(err){
    console.log(err);
    callback(undefined, err);
  }

}
