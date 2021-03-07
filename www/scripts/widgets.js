class statusBanner {
  constructor(id, defaultCaption){
    this.elementId = id;
    this.defaultTextCaption = defaultCaption;
    this.timerAction;

    this.setToDefaultCaption();
  }

  setToDefaultCaption(){
    var thisElement = document.getElementById(this.elementId);
    thisElement.innerHTML = this.defaultTextCaption;
    this.setToAlertDefault();
  }

  setActionAlert(caption, alert){
    var thisElement = document.getElementById(this.elementId);
    thisElement.innerHTML = caption;

    switch(alert){
      case "success":
      this.setToAlertSuccess();
      break;
      case "error":
      this.setToAlertError();
      break;
    }

    if (this.timerAction != undefined){
      clearTimeout(this.timerAction);
    }

    this.timerAction = setTimeout(this.setToDefaultCaption.bind(this), 5000);
  }

  setToAlertDefault(){
    var thisElement = document.getElementById(this.elementId);
    thisElement.className = "alert alert-light row justify-content-center";
  }

  setToAlertError(){
    var thisElement = document.getElementById(this.elementId);
    thisElement.className = "alert alert-danger row justify-content-center";
  }

  setToAlertSuccess(){
    var thisElement = document.getElementById(this.elementId);
    thisElement.className = "alert alert-success row justify-content-center";
  }
}

class countdownTimer {
  constructor(id, createdDate, expiration){
    this.elementId = id;
    this.createdDate = createdDate;
    this.expiration = expiration;
    this.thisTimer;
  }

  updateTimerAttributes(createdDate, expiration){
    this.createdDate = createdDate;
    this.expiration = expiration;
  }

  startTimer(){
    this.updateTimer();
    this.thisTimer = setInterval(this.updateTimer.bind(this), 1000);
  }

  stopTimer(){
    clearInterval(this.thisTimer);
  }

  updateTimer(){
    var thisElement = document.getElementById(this.elementId);

    var countDownObj = this.getCountDownValue();

    if (countDownObj != undefined){
      var countdownText = countDownObj["Days"] + " Days ";
      countdownText += countDownObj["Hours"] + " Hours ";
      countdownText += countDownObj["Minutes"] + " Minutes";

      thisElement.innerHTML = countdownText;
    } else {
      thisElement.innerHTML = "Expired";
    }
  }

  getCountDownValue(){
    var createdTimeValue = new Date(this.createdDate).getTime() / 1000;
    var timeExpire = createdTimeValue + parseFloat(this.expiration);
    var timeNow = new Date().getTime() / 1000;
    var timeLeft = timeExpire - timeNow;

    if (timeLeft < 0){
      return undefined;
    }

    var daysLeft = Math.floor(timeLeft / 86400);
    var daysRemainder = timeLeft % 86400;
    var hoursLeft = Math.floor(daysRemainder / 3600);
    var hoursRemainder = daysRemainder % 3600;
    var minutesLeft = Math.floor(hoursRemainder / 60);

    var countDownObj = {};
    countDownObj["Days"] = daysLeft;
    countDownObj["Hours"] = hoursLeft;
    countDownObj["Minutes"] = minutesLeft;

    return countDownObj;
  }
}

class numberDisplayWidget {
  constructor(id, defaultValue, preCaption = '', postCaption = '') {
    this.elementId = id;
    this.widgetVal;
    this.defaultValue = defaultValue;
    this.preCaption = preCaption;
    this.postCaption = postCaption;
    this.headerSize = "h1";
  }

  setValue(newValue){
    this.widgetVal = newValue;

    this.renderWidget();
  }

  setHeaderValue(headerTag){
    if (headerTag.startsWith("h")){
      var headerSizeVal = headerTag.substr(1,1);

      if (headerSizeVal > 0 && headerSizeVal < 7){
        this.headerSize = headerTag;
      }
    }
  }

  renderWidget(){
    var documentElement = document.getElementById(this.elementId);

    documentElement.setAttribute("style", "border:solid; align-items:center; white-space: pre-wrap; width:100%;");

    var displayWidget = this.renderInnerWidget();

    if (this.widgetVal == undefined){
      displayWidget.innerText = this.preCaption + this.defaultValue + this.postCaption;
    } else {
      displayWidget.innerText = this.preCaption + this.widgetVal + this.postCaption;
    }
    documentElement.innerHTML = displayWidget.outerHTML;
  }

  renderInnerWidget(){
    var displayWidget = document.createElement("div");
    displayWidget.setAttribute("class", "row justify-content-center " + this.headerSize);
    displayWidget.setAttribute("style", "padding: 70px 0;");

    return displayWidget;
  }
}

class ipListTextArea {
  constructor(id){
    this.elementId = id;
    this.ipListObj;
  }

  setValue(ipList){
    this.ipListObj = ipList;
  }

  getText(){
    return document.getElementById(this.elementId).value;
  }

  convertTextToObj(ipListText) {
    var ipListObjArray = [];

    try {
      var ipArray = ipListText.split("\n");

      if (ipArray != undefined && ipArray.length > 0){
        for (var i = 0; i < ipArray.length; i++){
          var thisIPObject = ipArray[i];

          if (thisIPObject != undefined && thisIPObject != ''){
            var ipCidr = thisIPObject.split("/");

            if (ipCidr.length == 2){
              var ipAddressComponent = ipCidr[0];
              var cidrComponent = ipCidr[1];

              if (ipAddressComponent.split(".").length == 4){
                var ipListObject = {};
                ipListObject["ipAddr"] = ipAddressComponent;
                ipListObject["cidr"] = cidrComponent;

                ipListObjArray.push(ipListObject);
              }
            }
          }
        }
      }

      return ipListObjArray;
    } catch (err){
      console.log(err);
      return ipListObjArray;
    }
  }

  renderList(){
    var textAreaElement = document.getElementById(this.elementId);
    var displayText = '';

    if (this.ipListObj != undefined){
      for (var i = 0; i < this.ipListObj.length; i++){
        var thisObject = this.ipListObj[i];

        displayText += thisObject.ipAddr + "/" + thisObject.cidr + '\n';
      }
    }

    textAreaElement.value = displayText;
  }
}
