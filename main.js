const {app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu} = require("electron");
const path = require("path");
const url = require("url");
const lib = require("./lib.js");

var iconPath = path.join(__dirname, "./icon.png");

let mainWin;
let listWin;
let settingsWin;

let icon;
let iconMenu;
//let settings = lib.getSettings();

function createWindows() {

  mainWin = new BrowserWindow({title: "Music Sync", center: true, frame: false, width: 400, height: 57, resizable: false, transparent: true, show: false, icon: iconPath});
  listWin = new BrowserWindow({parent: mainWin, title: "Playlists", center: true, frame: false, width: 400, height: 150, resizable: false, transparent: true, show: false, icon: iconPath});
  settingsWin = new BrowserWindow({parent: mainWin, title: "Settings", center: true, frame: false, width: 400, height: 150, resizable: false, transparent: true, show: false, icon: iconPath});

  mainWin.setMenu(null);
  listWin.setMenu(null);
  settingsWin.setMenu(null);

  mainWin.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/index.html"),
    protocol: "file:",
    slashes: true
  }));

  listWin.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/list.html"),
    protocol: "file:",
    slashes: true
  }));

  settingsWin.loadURL(url.format({
    pathname: path.join(__dirname, "./sites/settings.html"),
    protocol: "file:",
    slashes: true
  }));

  mainWin.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      mainWin.hide();
    }
    return false;
  });

  listWin.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      listWin.hide();
    }
    return false;
  });

  settingsWin.on('close', function (event) {
    if( !app.isQuiting){
      event.preventDefault()
      settingsWin.hide();
    }
    return false;
  });

  mainWin.once("ready-to-show", function() {
    /*settings = lib.getSettings();
    if ((settings.showOnAutostart && settings.autostart) || !settings.autostart ) mainWin.show();
    start();*/mainWin.show();
  });

  ipcMain.on("toggle-main", function() {
    if (mainWin.isVisible()) {
      mainWin.hide();
    } else {
      mainWin.show();
    }
  });

  ipcMain.on("toggle-list", function() {
    if (listWin.isVisible()) {
      listWin.hide();
    } else {
      listWin.show();
    }
  });

  ipcMain.on("toggle-settings", function() {
    if (settingsWin.isVisible()) {
      settingsWin.hide();
    } else {
      settingsWin.show();
    }
  });

  ipcMain.on("log", function(event, args) {
    console.log(args);
  });

  globalShortcut.register("CmdOrCtrl+F12", function() {
    mainWin.webContents.openDevTools({"detach": true});
  });

  globalShortcut.register("CmdOrCtrl+R", function() {
    mainWin.reload();
    listWin.reload();
    settingsWin.reload();
  });
}

function start() {

  ipcMain.on("add-list", function(event, args) {
    lib.addList(args.id, args.dir, args.syncTime);
  });

  ipcMain.on("remove-list", function(event, args) {
    lib.removeList(args.id);
  });


  settings  = lib.getSettings();
  lib.maxDl = settings.maxDl;


  loop = setInterval(function() {

    lib.checkSynced(function(state) {
      for (i = 0; i < state.notSynced.length; i++) {
        lib.sync(state.notSynced[i], function(data) {
          if (!data.synced) {
            lib.download(state.notSynced[i], data.dl);
          }
        });
      }
    });

    totalProg = Math.round(lib.dlProg.done / lib.dlProg.total * 10000) / 100;
    keys = Object.keys(lib.dlProg.list);

    for (i = 0; i < keys.length; i++) {
      lib.dlProg.list[keys[i]].prog = Math.round(lib.dlProg.list[keys[i]].done / lib.dlProg.list[keys[i]].total * 10000) / 100;

      itemKeys = Object.keys(lib.dlProg.list[keys[i]].items);
      for (x = 0; x < itemKeys.length; x++) lib.dlProg.list[keys[i]].prog += (lib.dlProg.list[keys[i]].items[itemKeys[x]].prog / lib.dlProg.list[keys[i]].total * 100) / 100;

      totalProg += (lib.dlProg.list[keys[i]].prog / lib.dlProg.total * 100) / 100;
    }
    lib.dlProg.prog = totalProg;

  }, 100);
}


app.on("ready", function() {
  createWindows();
  iconMenu = Menu.buildFromTemplate([
        { label: 'Show', click: function(){
            mainWin.show();
        } },
        { label: 'Quit', click: function(){
            app.isQuiting = true;
            app.quit();
        } }
    ]);

    icon = new Tray(iconPath);
    icon.setToolTip("MusicSync");
    icon.setContextMenu(iconMenu);
    icon.on("click", function() {
      mainWin.show();
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
  if (mainWin === null) {
    createWindows();
  }
});
