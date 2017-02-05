const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu} = require("electron");
const path = require("path");
const url = require("url");
const basic = require("./lib/basic.js");

var iconPath = path.join(__dirname, "./icon.png");

let win;
let list;
let settings;

let icon;
let iconMenu;

function createWindows() {

  win = new BrowserWindow({title: "Music Sync", center: true, frame: false, width: 400, height: 40, resizable: false, show: false, icon: iconPath});
  list = new BrowserWindow({parent: win, title: "Playlists", center: true, frame: false, width: 400, height: 150, resizable: false, show: false, icon: iconPath});
  settings = new BrowserWindow({parent: win, title: "Settings", center: true, frame: false, width: 400, height: 150, resizable: false, show: false, icon: iconPath});

  win.setMenu(null);
  list.setMenu(null);
  settings.setMenu(null);

  win.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/index.html"),
    protocol: "file:",
    slashes: true
  }));

  list.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/list.html"),
    protocol: "file:",
    slashes: true
  }));

  settings.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/settings.html"),
    protocol: "file:",
    slashes: true
  }));

  win.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      win.hide();
    }
    return false;
  });

  list.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      list.hide();
    }
    return false;
  });

  settings.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      settings.hide();
    }
    return false;
  });

  win.once("ready-to-show", function() {
    win.show();
    start();
  });

  ipcMain.on("toggle-main", function() {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });

  ipcMain.on("toggle-list", function() {
    if (list.isVisible()) {
      list.hide();
    } else {
      list.show();
    }
  });

  ipcMain.on("toggle-settings", function() {
    if (settings.isVisible()) {
      settings.hide();
    } else {
      settings.show();
    }
  });

  ipcMain.on("add-list", function(event, args) {
    basic.add(args.id, args.dir);
  });

  ipcMain.on("remove-list", function(event,args) {
    basic.remove(args);
  });

  ipcMain.on("log", function(event, args) {
    console.log(args);
  });

  globalShortcut.register("CmdOrCtrl+F12", function() {
    win.webContents.openDevTools({"detach": true});
  });

  globalShortcut.register("CmdOrCtrl+R", function() {
    win.reload();
    list.reload();
    settings.reload();
  });
}

function start() {
  basic.init();

  setTimeout(function () {
    var data = basic.info.data;

    data.activeDl = 0;
    data.refreshComplete = true;
    data.remove.total = 0;
    data.remove.complete = 0;
    data.remove.progress = -1;
    data.download.total = 0;
    data.download.complete = 0;
    data.download.progress = -1;

    setInterval(function () {
      var data = basic.info.data;

      if (data.activeDl < 0) data.activeDl = 0;
      if (data.activeDl > 0) data.refreshComplete = false;

      if (!data.refreshComplete) {
        if (data.download.total != data.download.complete) {
          if (data.download.progress == -1) data.download.progress = 0;
          data.download.progress = Math.floor(data.download.complete / data.download.total * 1000) / 10;
        } else if (data.download.total != 0) {
          data.download.total = 0;
          data.download.complete = 0;
          data.download.progress = -1;
        }

        if (data.remove.total != data.remove.complete) {
          if (data.remove.progress == -1) data.remove.progress = 0;
          data.remove.progress = Math.floor(data.remove.complete / data.remove.total * 1000) / 10;
        } else if (data.remove.total != 0) {
          data.remove.total = 0;
          data.remove.complete = 0;
          data.remove.progress = -1;
        }

        if ((data.download.progress == -1) && (data.remove.progress == -1)) {
          data.refreshComplete = true;
        }
      }

      var time = Math.floor(Date.now() / 1000);
      if ((time - data.lastRefresh) >= basic.info.settings.refresh) {
        data.lastRefresh = time;

        if (data.refreshComplete) {
          basic.refresh();
        }
      }
    }, 250);
  }, 500);
}

app.on("ready", function() {
  createWindows();
  iconMenu = Menu.buildFromTemplate([
        { label: 'Show', click:  function(){
            win.show();
        } },
        { label: 'Quit', click:  function(){
            app.isQuiting = true;
            app.quit();
        } }
    ]);

    icon = new Tray(iconPath);
    icon.setToolTip("MusicSync");
    icon.setContextMenu(iconMenu);
    icon.on("click", function() {
      win.show();
    });
});

app.on("window-all-closed", function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on("will-quit", function() {
  globalShortcut.unregisterAll();
});

app.on("activate", function() {
  if (win === null) {
    createWindows();
  }
});
