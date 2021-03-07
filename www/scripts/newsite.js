
function generateSite(expiration, mimetype, callback){
  var apiPrefix =  microhostSettingsJSON.apiPrefix;

  try {
    if (expiration != undefined && mimetype != undefined){
      var xhttp = new XMLHttpRequest();
      xhttp.open("POST", apiPrefix + '/createpage', true);
      xhttp.setRequestHeader('Content-type','application/json');

      var newSiteJSON = {};
      newSiteJSON["expiration"] = expiration;
      newSiteJSON["mimetype"] = mimetype;

      xhttp.onreadystatechange = function(){
        if (xhttp.readyState == 4 && xhttp.status == 200){
          var results = JSON.parse(xhttp.responseText);

          if (results.status == 'ok'){
            callback(results, undefined);
          } else {
            callback(undefined, new Error(results.error));
          }
        }
      }
    } else {
      callback(undefined, new Error("Invalid Input"));
    }

    xhttp.send(JSON.stringify(newSiteJSON));

  } catch (err) {
    callback(undefined, new Error("System Error"));
  }

}
