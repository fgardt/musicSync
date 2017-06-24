const ipcRenderer = require("electron").ipcRenderer;
const clipboard   = require("electron").remote.clipboard;

window.onload = function() {

  document.getElementById("exitTop").addEventListener("click", function(e) {
    ipcRenderer.send("toggle-list");
  });

/*  document.getElementById("add").addEventListener("click", function(e) {
    var url = clipboard.readText();
    var id = url.match(/youtube\.com\/(?:watch|playlist).+list=([\w\-]{12,})/);

    if (id !== null) {
      id = id[1];
      basic.selectDir(function(dir) {
        ipcRenderer.send("add-list", {"id" : id, "dir" : dir});
      });
    }
  });*/

  /*setInterval(function () {
    var info      = basic.info;
    var listNode  = document.getElementById("list")
    var childs    = listNode.children;

    if (childs.length > info.data.amount) {
      for (var i = 0; i < childs.length; i++) {
        if (info.playlists[childs[i].id] === undefined) {
          var cNode = childs[i].cloneNode(false);
          listNode.replaceChild(cNode, childs[i]);
        }
      }
    } else if (childs.length < info.data.amount) {
      for (var i = 0; i < Object.keys(info.playlists).length; i++) {
        var missing = true;
        for (var x = 0; x < childs.length; x++) {
          if (Object.keys(info.playlists)[i] == childs[x].id) {
            x = childs.length;
            missing = false;
          }
        }

        if (missing) {
          var playlist = info.playlists[Object.keys(info.playlists)[i]];

          if (playlist.name !== undefined && playlist.author !== undefined) {
            var row     = document.createElement("div");
            var name    = document.createElement("div");
            var buttons = document.createElement("div");

            row.id = playlist.uuid;

            row.className     = "row";
            name.className    = "col-xs-10";
            buttons.className = "col-xs-2";

            name.innerHTML = playlist.name + " by " + playlist.author;
            buttons.innerHTML = '<button type="button" class="icon-btn plBtn" onclick="remove(this)"><i class="material-icons">remove</i></button>';

            row.appendChild(name);
            row.appendChild(buttons);

            listNode.appendChild(row);
          }
        }
      }
    }

  }, 50);*/
};

function remove(btn) {
  var id = btn.parentNode.parentNode.id;
  console.log(id);
  ipcRenderer.send("remove-list", id);
}
