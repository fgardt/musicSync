const youtube      = require("youtube-api");
const _            = require("underscore");
const ytdl         = require("ytdl-core");
const path         = require("path");
const fs           = require("fs");

/**************************************************/
/**************************************************/
/**************************************************/

function getFile(file) {
  return JSON.parse(fs.readFileSync(file));
}


function updateFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getPlaylistData(id, data = null, pageToken = null) {
  youtube.playlistItems.list({
    part:"snippet",
    playlistId: id,
    maxResults: 50,
    pageToken: pageToken,
    key : conf.ytApiKey
  }, function(err, apiData) {
    if (!err) {
      if (data = null)
      {
        data = {};
        data.title = apiData.items[0].snippet.title;
        data.user  = apiData.items[0].snippet.channelTitle;
      }
      for (var x in apiData.items) {
        data.list[apiData.items[x].snippet.resourceId.videoId] = {"title" : apiData.items[x].snippet.title, "id" : apiData.items[x].snippet.resourceId.videoId};
      }

      if (apiData.nextPageToken) {
        getPlaylistData(id, data, apiData.nextPageToken);
      } else {
        return data;
      }
    } else {
      console.error(err);
    }
  });
}

/**************************************************/
/**************************************************/
/**************************************************/

module.exports = {

  activeDl: 0,
  maxDl: 1,
  dlProg: {"total": 0, "done": 0, "prog": 0, "list": {}},

  getSettings: function() {
    return getFile(path.join(__dirname, "./settings.json"));
  },

  updateSettings: function(data) {
    updateFile(path.join(__dirname, "./settings.json"), data);
  },

  getPlaylists: function() {
    return getFile(path.join(__dirname, "./playlists.json"));
  },

  updatePlaylists: function(data) {
    updateFile(path.join(__dirname, "./playlists.json"));
  },

  addPlaylist: function(id, dir, syncTime) {
    data = getPlaylistData(id);
    playlists = module.exports.getPlaylists();
    playlists[id] = {"title": data.title, "user": data.user, "dir": dir, "lastSynced": 0, "syncTime": syncTime, "syncing": false};
    module.exports.updatePlaylists(playlists);
    updateFile(path.join(dir, "./.music-sync"), data.list);
  },

  removePlaylist: function(id) {
    playlists = module.exports.getPlaylists();
    delete playlists[id];
    module.exports.updatePlaylists(playlists);
  },

  checkSynced: function(callback = null) {
    playlists = module.exports.getPlaylists();
    keys = Object.keys(playlists);
    state = {"synced": [], "notSynced": [], "syncing": []};
    for (i = 0; i < keys.length; i++) {
      if (playlists.keys[i].syncing) {
        state.syncing.push(keys[i]);
      } else if ((playlists.keys[i].lastSynced - playlists.keys[i].syncTime) <= 0) {
        state.synced.push(keys[i]);
      } else {
        state.notSynced.push(keys[i]);
      }
    }

    if (callback === null) {
      return state;
    } else {
      callback(state);
    }
  },

  sync: function(id, callback = null) {
    playlists = modules.export.getPlaylists();
    data = playlists[id];
    list = getFile(path.join(data.dir, "./.music-sync"));
    dataNew = getPlaylistData(id);
    listNew = dataNew.list;

    sync = {"dl": {}, "rm": {}, "synced": false};

    if (!_.isEqual(listNew, list)) {
      keysOld = Object.keys(list);
      keysNew = Object.keys(listNew);

      for (i = 0; i < keysNew.length; i++) if (keysOld.indexOf(keysNew[i]) == -1) sync.dl[keysNew[i]] = listNew[keysNew[i]];
      for (i = 0; i < keysOld.length; i++) if (keysNew.indexOf(keysOld[i]) == -1) sync.rm[keysOld[i]] = list[keysOld[i]];
    } else {
      sync.synced = true;
      data.lastSynced = _.now();
    }

    if (data.title !== dataNew.title) data.title = dataNew.title;
    if ((data.title !== dataNew.title) || (sync.synced)) {
      playlists[id] = data;
      module.exports.updatePlaylists(playlists);
    }

    if (callback === null) {
      return sync;
    } else {
      callback(sync);
    }
  },

  download: function(id, data, opt = {"audio": true, "quality": 250}) {
    playlists = modules.exports.getPlaylists();
    dir = playlists[id].dir;
    playlists[id].syncing = true;
    modules.export.updatePlaylists(playlists);

    if (opt.audio) {
      ext = ".mp3";
      arg = {"filter": "audioonly", "quality": opt.quality};
    } else {
      ext = ".mp4";
      arg = {"quality": opt.quality};
    }

    keys = Object.keys(data);
    modules.exports.dlProg.list[id] = {"total": keys.length, "done": 0, "prog": 0, "active": 0, "items": {}}

    for (i = 0; i < keys.length; i++) {
      item = data[keys[i]];
      loop = setInterval(function() {
        if (modules.export.activeDl < modules.export.maxDl) {
          modules.export.activeDl++;
          modules.export.dlProg.list[id].active++;
          modules.export.dlProg.list[id].items[item[i].id] = 0;

          dl = ytdl("https://www.youtube.com/watch?v=" + item.id, arg);
          dl.pipe(fs.createWriteStream(path.join(dir, "./" + item.title + ext)));

          dl.on("progress",function(chunkLength, downloaded, total) {
            modules.exports.dlProg.list[id].items[item[i].id].total = total;
            modules.exports.dlProg.list[id].items[item[i].id].dl = downloaded;
            modules.exports.dlProg.list[id].items[item[i].id].prog = Math.round(downloaded / total * 10000) / 100;
          });

          dl.on("end", function() {
            modules.exports.activeDl--;
            modules.export.dlProg.list[id].active--;
            modules.exports.dlProg.done++;

            dirInfo = getFile(path.join(dir, "./.music-sync"));
            dirInfo[items[i].id] = items[i];
            updateFile(path.join(dir, "./.music-sync"), dirInfo);

            if (modules.export.dlProg.list[id].active === 0) {
              playlists = modules.exports.getPlaylists();
              playlists[id].syncing = false;
              modules.exports.dlProg.done++;
              delete modules.exports.dlProg.list[id];
            }
          });

          clearInterval(loop);
        }
      }, 20);
    }
  }

}
