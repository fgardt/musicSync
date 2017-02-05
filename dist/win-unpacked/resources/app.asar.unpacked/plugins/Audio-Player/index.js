module.exports = {
  name: "Audio-Player",
  info: "Plays the synced audio files",
  author: "BrainGamer",
  start
};

function start() {
  // add play button
}

function play() {
  var audio = new Audio();
  audio.src = "L:/Music/Türküm & EBEN - Creed.mp3";
  audio.volume = 0.25;

  var ctx   = new AudioContext();
  var audioSrc = ctx.createMediaElementSource(audio);
  var analyser = ctx.createAnalyser();
  audioSrc.connect(analyser);
  analyser.connect(ctx.destination);
  var frequencyData = new Uint8Array(analyser.frequencyBinCount);

  function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (!audio.paused) {
      // update data in frequencyData
      analyser.getByteFrequencyData(frequencyData);
      // render frame based on values in frequencyData
      //console.log(frequencyData)

      var avg = 0;
      for (var i = 0; i < dataUsed; i++) avg += freqData[i];
      avg = Math.floor(avg / dataUsed);

      for (var i = 0; i < dataUsed; i++) {
        freqData[i] = Math.floor(Math.sqrt(freqData[i]) * avg);
      }

      //var min = Math.min.apply(Math, freqData);
      var max = Math.max.apply(Math, freqData);

    } else {
      for (var i = 0; i < dataUsed; i++) {
        document.getElementById("audioBar" + i + "_1").style.height = "1px";
        document.getElementById("audioBar" + i + "_2").style.height = "1px";
      }
    }
  }

  var rotStep = 180 / dataUsed;
  var rot = 180 - (rotStep / 2);
  for (var i = 0; i < dataUsed; i++)
  {
    var div1 = document.createElement("div");
    var div2 = document.createElement("div");

    div1.id = "audioBar" + i + "_1";
    div2.id = "audioBar" + i + "_2";
    div1.className = "audioBar";
    div2.className = "audioBar";

    div1.style.height = "1px";
    div2.style.height = "1px";
    div1.style.transform = "rotate(" + rot + "deg)";
    div2.style.transform = "rotate(" + -rot + "deg)";

    document.getElementById("makeDiv").appendChild(div1);
    document.getElementById("makeDiv").appendChild(div2);

    rot -= rotStep;
  }

  audio.play();
  renderFrame();
};
