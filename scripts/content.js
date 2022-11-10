function activateFeatures() {
  console.log('attemping to activate...')
  try {
    document.querySelector('#io-overlay').firstChild.setAttribute('style', 'zoom: 1 ;opacity: 1 !important');
  } catch {}
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
