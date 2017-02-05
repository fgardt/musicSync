const basic = require("../lib/basic.js");
const {remote, ipcRenderer} = require("electron");

basic.init();
var x = 0;

window.onload = function() {

  document.getElementById("minTop").addEventListener("click", function (e) {
    remote.getCurrentWindow().minimize();
  });

  document.getElementById("exitTop").addEventListener("click", function(e) {
    ipcRenderer.send("toggle-main");
  });

  document.getElementById("settingsTop").addEventListener("click", function(e) {
    ipcRenderer.send("toggle-settings");
  });

  document.getElementById("listTop").addEventListener("click", function(e) {
    ipcRenderer.send("toggle-list");
  });

  setInterval(function () {
    var state = document.getElementById("state");
    if (!basic.info.data.refreshComplete) {
      x++;
      state.className = "material-icons icon syncing";
    } else {
      if (x > 75) {
        x = 180;
      } else {
        x = 0;
      }
      state.className = "material-icons icon";
    }

    state.style.transform = "rotate("+ -x +"deg)";
    if (x > 180) x = 1;
  }, 10);
};
