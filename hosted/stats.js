class microhoststats {
  constructor(cachehandler){
    this.statsCh = cachehandler;
  }

  getNumberOfActivePages(callback){
    var activePagesCount = 0;

    this.statsCh.getAllObjects("PagesCache", function(dataArray, err){
      if (!err){
        if (dataArray != undefined){
          activePagesCount = dataArray.length;
        }
        callback(activePagesCount, undefined);
      } else {
        callback(activePagesCount, err);
      }
    });
  }

  getSitesCreatedInTime(timeStart, timeEnd, callback){
    var createdSitesTime = 0;

    if (timeStart != undefined && timeEnd != undefined){
      this.statsCh.getAllObjects("PagesCache", function(dataArray, err){
        if (!err){
          if (dataArray != undefined){
            for (var i = 0; i < dataArray.length; i++){
              var thisData = dataArray[i];
              var createdDate = new Date(thisData.createdDate);

              if (createdDate.getTime() > timeStart && createdDate.getTime() < timeEnd){
                createdSitesTime++;
              }
            }
          }
          callback(createdSitesTime, undefined);
        } else {
          callback(createdSitesTime, err);
        }
      });
    } else {
      callback(createdSitesTime, new Error("Invalid time range"));
    }
  }

  getIndividualIPAddresses(callback){
    var getIndividualIPAddresses = 0;
    var ipAddressHash = {};

    this.statsCh.getAllObjects("PagesCache", function(dataArray, err){
      if (!err){
        for (var i = 0; i < dataArray.length; i++){
          var thisData = dataArray[i];

          if (ipAddressHash[thisData.ipAddr] == undefined){
            ipAddressHash[thisData.ipAddr] = true;
          }
        }

        getIndividualIPAddresses = Object.keys(ipAddressHash).length;

        callback(getIndividualIPAddresses, undefined);
      } else {
        callback(getIndividualIPAddresses, err);
      }
    });
  }
}

module.exports = microhoststats;
