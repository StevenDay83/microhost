class datamanager {
  constructor(cachemanager, settings){
    // this.settings = settings;
    this.cacheManager = cachemanager;
  }

  // rehashSettings(settings){
  //   this.settings = settings;
  // }

  initalizePageExpirationWatch(){
    setInterval(this.checkPageExpirations.bind(this), 60000);
  }

  checkPageExpirations(){
    var that = this;
    this.cacheManager.getAllObjects("PagesCache", function(dataArray, err){
      var removeArray = [];
      if (!err){
        for (var i = 0; i < dataArray.length; i++){
          var thisDataCreatedDate = new Date(dataArray[i].createdDate);
          var thisDataExpirationSeconds = dataArray[i].expiration;
          var timeNow = new Date();

          // console.log(timeNow.getTime() * 1000);
          // console.log((timeNow.getTime() / 1000 - thisDataCreatedDate.getTime() / 1000));
          // console.log(thisDataExpirationSeconds);

          if ((timeNow.getTime() / 1000 - thisDataCreatedDate.getTime() / 1000) >= thisDataExpirationSeconds){
            // Remove entry
            console.log("Adding " + dataArray[i].publicURLSuffix);
            removeArray.push(dataArray[i].publicURLSuffix);
          }
        }

        for (var x = 0; x < removeArray.length; x++){
          var removeEntry = removeArray[x];

          console.log("Deleting object " + removeEntry);

          that.cacheManager.deleteObjectById("PagesCache", removeEntry, function(deleteObj, err){
            if (!err){
              console.log("Deleted object " + deleteObj.publicURLSuffix);
            } else {
              console.log(err);
            }
          });
        }
      }
    });
  }
}

module.exports = datamanager;
