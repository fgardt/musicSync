const {remote, ipcRenderer, dialog} = require("electron");
const youtubedl = require("youtube-dl");
const _         = require("underscore");
const yt        = require("./yt.js");
const path      = require("path");
const fs        = require("fs");

module.exports = {
  defaultInfoFile: {"settings" : {"refresh" : 600, "maxDl" : 2}, "data" : {"amount": 0, "lastUuid" : "a5a5", "refreshComplete" : true, "dir" : null, "lastRefresh" : 0, "activeDl" : 0, "remove" : {"total" : 0, "complete" : 0, "progress" : -1}, "download" : {"total" : 0, "complete" : 0, "progress" : -1}},"playlists" : {}},
  info: null,
  info_old: null,
  debug: false,

  init: function() {
    module.exports.info = module.exports.getInfoFile();
    var x = 0;
    setInterval(function () {
      x++;

      if (!_.isEqual(module.exports.info, module.exports.info_old)) {
        module.exports.updateInfoFile(module.exports.info);
      }

      if (x > 5) {
        x = 0;
        module.exports.info = module.exports.getInfoFile();
      }

      module.exports.info_old = JSON.parse(JSON.stringify(module.exports.info));
    }, 25);
  },

  checkInfoFile: function() {
    if (!fs.existsSync(path.join(__dirname, "../data.json"))) {
      if (module.exports.debug) console.log("data.json not found! Creating it now..");
      var file = fs.openSync(path.join(__dirname, "../data.json"), 'w');
      if (module.exports.info === null) {
        fs.writeFileSync(file, JSON.stringify(module.exports.defaultInfoFile, null, 2));
      } else {
        fs.writeFileSync(file, JSON.stringify(module.exports.info, null, 2));
      }
      fs.closeSync(file);
    } else if (module.exports.info !== null){
      try {
        if (module.exports.info.data.amount != Object.keys(module.exports.info.playlists).length) {
          module.exports.info.data.amount = Object.keys(module.exports.info.playlists).length;
        }

        if (module.exports.info.settings.refresh < 1) {
          module.exports.info.settings.refresh = 5;
        }
      } catch (e) {
        if (module.exports.debug) console.log("data.json corrupted! Recreating it now..", e);
        var file = fs.openSync(path.join(__dirname, "../data.json"), 'w');
        fs.writeFileSync(file, JSON.stringify(module.exports.defaultInfoFile, null, 2));
        fs.closeSync(file);
      }
    }
  },

  getInfoFile: function(skipCheck) {
    if (!skipCheck) module.exports.checkInfoFile();
    var file = fs.openSync(path.join(__dirname, "../data.json"), 'r');
    try {
      var info = JSON.parse(fs.readFileSync(path.join(__dirname, "../data.json")));
    } catch (e) {
      console.warn("[Catched] " + e);
      info = module.exports.info;
    }
    fs.closeSync(file);
    return info;
  },

  updateInfoFile: function(info, skipCheck) {
    if (!skipCheck) module.exports.checkInfoFile();
    var file = fs.openSync(path.join(__dirname, "../data.json"), 'w');
    fs.writeFileSync(file, JSON.stringify(info, null, 2));
    fs.closeSync(file);
  },

  updatePlaylist: function(uuid, callback) {
    var id = module.exports.info.playlists[uuid].id;
    yt.getPlaylistItems(id, undefined, undefined, function(tracks) {
      yt.api("playlists", ["part=snippet", "id=" + id], function(data) {
        data = JSON.parse(data);
        module.exports.info.playlists[uuid].name   = data.items[0].snippet.title;
        module.exports.info.playlists[uuid].author = data.items[0].snippet.channelTitle;
      });

      var data = {};

      for (var i = 0; i < tracks.length; i++) {
        data[tracks[i].id] = tracks[i];
      }

      module.exports.info.playlists[uuid].all = data;
      module.exports.checkLocalTracks(uuid);
      module.exports.checkSyncedTracks(uuid);

      try {
        callback(uuid);
      } catch (e) {
        if (module.exports.debug) console.warn("[Catched] " + e);
      }
    });
  },

  checkSyncedTracks: function(uuid) {
    var playlist = module.exports.info.playlists[uuid];
    var all_keys   = Object.keys(playlist.all);
    var local_keys = Object.keys(playlist.local);

    playlist.notSynced.download = [];
    playlist.notSynced.remove = [];

    for (var i = 0; i < all_keys.length; i++) {
      if (local_keys.indexOf(all_keys[i]) == -1) playlist.notSynced.download.push(all_keys[i]);
    }

    for (var i = 0; i < local_keys.length; i++) {
      if (all_keys.indexOf(local_keys[i]) == -1) playlist.notSynced.remove.push(local_keys[i]);
    }

    return playlist.notSynced;
  },

  checkLocalTracks: function(uuid) {
    var playlist = module.exports.info.playlists[uuid];
    var dir   = playlist.dir;
    var local = playlist.local;

    for (var i = 0; i < Object.keys(local).length; i++) {
      var name = local[Object.keys(local)[i]].name;

      if (!fs.existsSync(path.join(dir, "./" + name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "") + ".mp3"))) {
        if (module.exports.debug) console.log("Missing " + name);
        delete local[Object.keys(local)[i]];
      }
    }

    return local;
  },

  selectDir: function(callback) {
    var dialog = require("electron").dialog || remote.dialog;
    dialog.showOpenDialog({
      title: "Select folder",
      buttonLabel: "Select",
      properties: ["openDirectory"]},
      function(res) {
        if (res !== undefined) {
          module.exports.info.data.dir = res[0];

          try {
            callback(res[0]);
          } catch (e) {
            if (module.exports.debug) console.warn("[Catched] " + e);
          }
        } else {
          module.exports.info.data.dir = null;
        }
        if (module.exports.debug) console.log(module.exports.info.data.dir);
    });
  },

  refresh: function() {
    if (module.exports.debug) console.log("Refresh..");
    module.exports.info.data.refreshComplete = false;

    if (module.exports.info.data.amount > 0) {
      var playlists = module.exports.info.playlists;
      for (var i = 0; i < Object.keys(playlists).length; i++) {

        var uuid = playlists[Object.keys(playlists)[i]].uuid;
        module.exports.updatePlaylist(uuid, function(uuid) {
          var playlist = module.exports.info.playlists[uuid];

          if (playlist.notSynced.remove.length > 0) {
            module.exports.info.data.remove.total += playlist.notSynced.remove.length;
            for (var i = 0; i < playlist.notSynced.remove.length; i++) {
              module.exports.removeTrack(uuid, playlist.notSynced.remove[i]);
            }
          }

          if (playlist.notSynced.download.length > 0) {
            module.exports.info.data.download.total += playlist.notSynced.download.length;
            for (var i = 0; i < playlist.notSynced.download.length; i++) {
              module.exports.downloadTrack(uuid, playlist.notSynced.download[i]);
            }
          }
        });
      }
    }
  },

  add: function(id, dir) {
    module.exports.info.data.amount++;
    module.exports.info.data.lastUuid = (parseInt(module.exports.info.data.lastUuid, 16) + Math.floor((Math.random() * 100) * 1)).toString(16);
    module.exports.info.playlists[module.exports.info.data.lastUuid] = {"uuid" : module.exports.info.data.lastUuid, "id" : id, "dir" : dir, "local" : {}, "all" : {}, "notSynced" : []};
    module.exports.updatePlaylist(module.exports.info.data.lastUuid, function(uuid) {
      if (module.exports.debug) console.log("Added with uuid " + uuid);
    });
  },

  remove: function(uuid) {
    delete module.exports.info.playlists[uuid];
    module.exports.info.data.amount--;
  },

  removeTrack: function removeTrack(uuid, id) {
    var playlist = module.exports.info.playlists[uuid];
    var dir   = playlist.dir;
    var data  = playlist.local[id];
    var name  = data.name;
    var file  = path.join(dir, "./" + name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "") + ".mp3");
    if (module.exports.debug) console.log("Removing " + name + " (" + id + ")");

    fs.unlink(file, function(e) {
      if (err) {
        console.warn("[Catched] " + e);
      } else {
        delete data;
      }
      playlist.notSynced.remove.splice(playlist.notSynced.remove.indexOf(id), 1);
      module.exports.info.data.remove.complete++;
    });
  },

  downloadTrack: function(uuid, id) {
    var maxDl = module.exports.info.settings.maxDl;
    var playlist = module.exports.info.playlists[uuid];
    var name  = playlist.all[id].name;
    var filename = path.join(playlist.dir, "./" + name.replace(/[\\\/\:\*\?\"\<\>\|]/g, ""));
    var downloading = false;

    var interval = setInterval(function () {
      if (!downloading) {
        if (module.exports.info.data.activeDl < module.exports.info.settings.maxDl) {
          module.exports.info.data.activeDl++;
          downloading = true;
          if (module.exports.debug) console.log("Downloading " + name + " (" + id + ")");
          try {
            var dl = youtubedl("https://www.youtube.com/watch?v=" + id, ["-x", "--audio-format=mp3", "--audio-quality=0"],{ cwd: __dirname });
            dl.pipe(fs.createWriteStream(filename + ".mp3"));
            dl.on("end", function() {
              if (module.exports.debug) console.log("Finished "+ name);
              module.exports.info.data.activeDl--;
              playlist.local[id] = {"id" : id, "name" : name};
              playlist.notSynced.download.splice(playlist.notSynced.download.indexOf(id), 1);
              module.exports.info.data.download.complete++;
            });
          } catch (e) {
            console.warn("Error [" + name + "]", e);
            module.exports.info.data.activeDl--;
            module.exports.info.data.download.complete++;
          }
        }
      } else {
        clearInterval(interval);
      }
    }, 50);
  }
}
