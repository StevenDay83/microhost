var fs = require("fs");

class serverSettings {
  constructor(filename){
    this.filename = filename;
    this.settings = {};
  }

  loadSettings () {
    var isSuccess = false;

    try {
      var data = fs.readFileSync(this.filename);

      this.settings = JSON.parse(data);
      isSuccess = true;
    } catch (err){
      console.log(err);
    }

    return isSuccess;
  }

  saveSettings() {
    var isSuccess = false;

    try {
      fs.writeFileSync(this.filename, JSON.stringify(this.settings));

      isSuccess = true;
    } catch (err) {
      console.log(err);
    }
    return isSuccess;
  }

  getSettings () {
    return this.settings;
  }

  getSettingsSection(section){
    return this.settings[section];
  }
}

module.exports = serverSettings;
