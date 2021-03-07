var fs = require("fs");

class logger {
  constructor(settings){
    this.settings = settings;
    this.logInfoEventQueue = [];
    this.logAccessEventQueue = [];
    this.logErrorEventQueue = [];
    this.interval;

    console.log(this.settings);
  }

  startLogger(){
    this.interval = setInterval(this.writeEventsToDisk.bind(this), 5000);
  }

  stopLogger(){
    clearInterval(this.interval);
  }

  logEvent(loglevel, message) {
    if (loglevel != undefined && message != undefined){
      if (loglevel == "INFO") {
        var logEntryObj = {};
        logEntryObj["timeStamp"] = new Date().toISOString();
        logEntryObj["message"] = message;

        this.logInfoEventQueue.push(logEntryObj);
        console.log(logEntryObj["timeStamp"] + " - " + "INFO - " + logEntryObj["message"]);
      } else if (loglevel == "ERROR"){
        var logEntryObj = {};
        logEntryObj["timeStamp"] = new Date().toISOString();
        logEntryObj["message"] = message;

        this.logErrorEventQueue.push(logEntryObj);
        console.error(logEntryObj["timeStamp"] + " - " + "ERROR - " + logEntryObj["message"]);
      } else if (loglevel == "ACCESS"){
        var logEntryObj = {};
        logEntryObj["timeStamp"] = new Date().toISOString();
        logEntryObj["message"] = message;

        this.logAccessEventQueue.push(logEntryObj);
        console.log(logEntryObj["timeStamp"] + " - " + "ACCESS - " + logEntryObj["message"]);
      }
    }
  }

  writeEventsToDisk(){
    var logInfoString = '';
    var logErrorString = '';
    var logAccessString = '';
    var os = require("os");

    for (var i = 0; i < this.logInfoEventQueue.length; i++){
      var thisEvent = this.logInfoEventQueue[i];

      if (thisEvent != undefined){
        logInfoString += thisEvent.timeStamp + " - " + "INFO - " + thisEvent.message + os.EOL;
      }
    }

    if (logInfoString != ''){
      var that = this;
      fs.appendFile(this.settings.infologfile, logInfoString, function(err){
        if (err){
          console.log(err);
        } else {
          that.logInfoEventQueue = [];
        }
      });
    }

    // Write Error

    for (var j = 0; j < this.logErrorEventQueue.length; j++){
      var thisEvent = this.logErrorEventQueue[j];

      if (thisEvent != undefined){
        logErrorString += thisEvent.timeStamp + " - " + "ERROR - " + thisEvent.message + os.EOL;
      }
    }

    if (logErrorString != ''){
      var that = this;
      fs.appendFile(this.settings.errorlogfile, logErrorString, function(err){
        if (err){
          console.log(err);
        } else {
          that.logErrorEventQueue = [];
        }
      });
    }

    // Access Log

    for (var k = 0; k < this.logAccessEventQueue.length; k++){
      var thisEvent = this.logAccessEventQueue[k];

      if (thisEvent != undefined){
        logAccessString += thisEvent.timeStamp + " - " + "ACCESS - " + thisEvent.message + os.EOL;
      }
    }

    if (logAccessString != ''){
      var that = this;
      fs.appendFile(this.settings.accesslogfile, logAccessString, function(err){
        if (err){
          console.log(err);
        } else {
          that.logAccessEventQueue = [];
        }
      });
    }
  }
}

module.exports = logger;
