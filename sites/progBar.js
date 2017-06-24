function progBar(element, prog) {
  if (prog > 100) prog = 100;

  bar = element.childNodes[1];
  bar.style.width = prog + "%";

  if (prog === 100) {
    setTimeout(function () {

      setTimeout(function () {
        bar.style.opacity = 0;
        setTimeout(function () {
          bar.style.width = "0%";
          setTimeout(function () {
            bar.style.opacity = 1;
          }, 200);
        }, 200);
      }, 200);
    }, 1500);
  }
}

module.exports = progBar;
