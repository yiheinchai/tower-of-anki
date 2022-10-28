document.body.onkeyup = function(e) {
  if (e.key == " " ||
      e.code == "Space" ||      
      e.keyCode == 32      
  ) {
    if(study.state === 'answerShown') {
        study.answerCard(3)
    } else {
        study.drawAnswer()
    }
    
  }
}

