function activateFeatures() {
  console.log('attemping to activate...')
  try {
    document.querySelector('#io-overlay').firstChild.setAttribute('style', 'zoom: 1 ;opacity: 1 !important');
  } catch {}
  document.querySelectorAll('img').forEach((ele) => ele.setAttribute('style', ' -webkit-filter: invert(100%); -moz-filter: invert(100%); -o-filter: invert(100%); -ms-filter: invert(100%); '))
}
try {
  document.body.onkeyup = function (e) {
    if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
      if (study.state === "answerShown") {
        study.answerCard(3);
      } else {
        study.drawAnswer();
      }
    } else if (e.keyCode == 49 || e.keyCode == 90) {
      if (study.state === "answerShown") {
        study.answerCard(1);
      }
    } else if (e.keyCode == 50 || e.keyCode == 88) {
      if (study.state === "answerShown") {
        study.answerCard(2);
      }
    } else if (e.keyCode == 51 || e.keyCode == 86) {
      if (study.state === "answerShown") {
        study.answerCard(3);
      }
    }
  };
} catch {
}

setInterval(activateFeatures, 10)

try {
  const css = 'html {-webkit-filter: invert(100%);' + '-moz-filter: invert(100%);' + '-o-filter: invert(100%);' + '-ms-filter: invert(100%); }';
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  if (!window.counter) { 
      window.counter = 1;
  } else { 
      window.counter++;
      if (window.counter % 2 == 0) { 
          const css = 'html {-webkit-filter: invert(0%); -moz-filter: invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%); }'
      } 
  }
  style.type = 'text/css';
  if (style.styleSheet) {
      style.styleSheet.cssText = css;
  } else {
      style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
} catch {}
