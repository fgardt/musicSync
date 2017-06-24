const ipcRenderer = require("electron").ipcRenderer;

window.onload = function() {

  document.getElementById("exitTop").addEventListener("click", function(e) {
    ipcRenderer.send("toggle-settings");
  });


  //document.getElementById("value_refresh").value = basic.info.settings.refresh / 60;
  //document.getElementById("value_maxDl").value = basic.info.settings.maxDl;

  /*setInterval(function () {
    var refresh = Number(document.getElementById("value_refresh").value) * 60;
    var maxDl = Number(document.getElementById("value_maxDl").value);

    if (refresh != basic.info.settings.refresh) basic.info.settings.refresh = refresh;
    if (maxDl != basic.info.settings.maxDl) basic.info.settings.maxDl = maxDl;

    document.getElementById("value_refresh").value = basic.info.settings.refresh / 60;
    document.getElementById("value_maxDl").value = basic.info.settings.maxDl;
  }, 100);*/
};
