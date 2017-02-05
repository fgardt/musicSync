var pluginDir = path.join(__dirname, "../plugins");
var plugins = fs.readdirSync(pluginDir);
var loadedPl = [];

plugins.forEach(function (dir) {
  loadPlugin(dir);
});

function loadPlugin(name) {
  var file = path.join(pluginDir, "./" + name + "/index.js");
  try {
    var pl = require(file);
    pl.start();
    if (debug) console.log("Loaded " + pl.name);
    loadedPl.push(pl);
  } catch (e) {
    console.warn(dir, e);
  }
}
