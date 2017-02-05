const net = require("electron").net;
const StringDecoder = require('string_decoder').StringDecoder;

module.exports = {
  debug: false,
  api: function(method, data, callback) {
    var dataString = "?key=AIzaSyD1bbICFDdjl_bAoG-OTfa5SotkQN561Gc";

    if (data !== null) {
      for (var i = 0; i < data.length; i++) dataString += "&" + data[i];
    }

    var request = net.request({
      method: "GET",
      protocol: "https:",
      hostname: "www.googleapis.com",
      port: 443,
      path: "/youtube/v3/" + method + dataString
    });

    var data = "";
    var decoder = new StringDecoder("utf8");

    request.on("response", function(response) {
      response.on("data", function(chunk) {
        data += decoder.write(chunk);
      });

      response.on("end", function() {
        try {
          if (module.exports.debug) console.log("API success");
          if (data !== "") {
            callback(data);
          }
        } catch (e) {
          console.warn(e);
        }
      });
    });

    request.end();
  },

  getPlaylistItems: function(id, page, knownTracks, callback) {
    var arg = ["maxResults=50", "part=snippet", "playlistId=" + id];
    if (page !== undefined) arg.push("pageToken=" + page);
    if (knownTracks === undefined) knownTracks = [];

    module.exports.api("playlistItems", arg, function (result) {
      var data = JSON.parse(result);

      if (data["error"] === undefined) {
        knownTracks.push.apply(knownTracks, data["items"]);

        if (data["nextPageToken"] !== undefined) {
          module.exports.getPlaylistItems(id, data["nextPageToken"], knownTracks, callback);
        } else {
          var allTracks = module.exports.filter(knownTracks);

          try {
            callback(allTracks);
          } catch (e) {
            console.warn(e);
          }
        }
      }
    });
  },

  filter: function(rawData) {
    var filtered = [];

    for (var i = 0; i < rawData.length; i++) {
        filtered.push({"name": rawData[i]["snippet"]["title"], "id": rawData[i]["snippet"]["resourceId"]["videoId"], "position" : rawData[i]["snippet"]["position"]});
    }

    return filtered;
  }
}
