const studyObj = study

function activateFeatures() {
  console.log('attemping to activate...')
  try {
    document.querySelector('#io-overlay').firstChild.setAttribute('style', 'zoom: 1 ;opacity: 1 !important');
  } catch {}
}

document.body.onkeyup = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    if (studyObj.state === "answerShown") {
      studyObj.answerCard(3);
    } else {
      studyObj.drawAnswer();
    }
  } else if (e.keyCode == 49 || e.keyCode == 90) {
    if (studyObj.state === "answerShown") {
      studyObj.answerCard(1);
    }
  } else if (e.keyCode == 50 || e.keyCode == 88) {
    if (studyObj.state === "answerShown") {
      studyObj.answerCard(2);
    }
  } else if (e.keyCode == 51 || e.keyCode == 86) {
    if (studyObj.state === "answerShown") {
      studyObj.answerCard(3);
    }
  }
};

setInterval(activateFeatures, 50)
