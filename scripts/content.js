function formatDate(date) {
  let dd = String(date.getDate()).padStart(2, "0");
  let mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  let yyyy = date.getFullYear();
  return dd + "/" + mm + "/" + yyyy;
}

function generateArrayofXElements(x) {
  return Array.from(
    {
      length: x,
    },
    (_, i) => i + 1
  );
}


function FloorComponent(
  floor,
  currentStepInFloor,
  totalStepsForFloor,
  level,
  currentXpInLevel,
  totalXpInLevel
) {
  return `
<div style="display:flex;flex-direction: row;justify-content: center;align-items: center;gap: 1rem;" class="floor_wrapper">
  <div style="white-space: nowrap;">Lvl ${level} (${Math.floor(
    levelPercentageCompletion * 100
  )}%)</div>
  <div style="white-space: nowrap;">Floor ${floor}</div>
  <div style="display: grid;grid-template-columns: repeat(${totalStepsForFloor}, 1fr);grid-template-rows: 1fr;height: 1rem; width: 100%;">
    ${generateArrayofXElements(totalStepsForFloor).reduce((acc, ele, index) => {
      if (index <= currentStepInFloor) {
        return (
          acc +
          `<div style="border: 1px solid black; background-color: green;"></div>`
        );
      } else {
        return acc + `<div style = "border: 1px solid black;"></div>`;
      }
    }, ``)}
  </div>
</div>
`;
}

// A function that calculates the level, current xp and next xp given total xp
// A function that takes an integer of experience and returns the level and the experience to the next level
function calculateLevel(exp) {
  // Assume that the level formula is: level = Math.floor(Math.sqrt(exp))
  // And the experience to the next level formula is: nextExp = (level + 1) * (level + 1) - exp
  let level = Math.floor(Math.sqrt(exp)); // Calculate the level from the experience
  let cumulativeExpAtNextLevel = (level + 1) * (level + 1); // Calculate the total experience required for the next level
  let cumulativeExpAtCurrentLevel = level * level; // Calculate the total experience required for the current level
  let playerExpAtCurrentLevel = exp - cumulativeExpAtCurrentLevel; // Calculate the experience required for the current level
  let expToNextLevel = cumulativeExpAtNextLevel - cumulativeExpAtCurrentLevel; // Calculate the experience required for the next level
  return [level, playerExpAtCurrentLevel, expToNextLevel]; // Return an array with the level and the experience to the next level
}

function updateLevelDisplay() {
  level_record = JSON.parse(window.localStorage.getItem("level_record"));
  const todayDate = formatDate(new Date());
  if (level_record === null || level_record[todayDate] === undefined) {
    [level, currentReps, totalReps] = calculateLevel(0);
    document.querySelector(".pt-1").innerHTML = LevelComponent(
      level,
      currentRep,
      totalReps
    );
  } else {
    const totalXp = level_record[todayDate];
    [level, currentRep, totalReps] = calculateLevel(totalXp);
    document.querySelector(".pt-1").innerHTML = LevelComponent(
      level,
      currentRep,
      totalReps
    );
  }
}

function onAnswerUpdateRecord() {
  level_record = JSON.parse(window.localStorage.getItem("level_record"));
  const todayDate = formatDate(new Date());
  if (level_record === null || level_record[todayDate] === undefined) {
    window.localStorage.setItem(
      "level_record",
      JSON.stringify({ [todayDate]: 0 })
    );
  } else {
    currentCount = level_record[todayDate];
    level_record[todayDate] = currentCount + 1;
    window.localStorage.setItem("level_record", JSON.stringify(level_record));
    updateLevelDisplay();
  }
}

function activateDarkMode() {
  console.log("attemping to activate...");
  try {
    document
      .querySelector("#io-overlay")
      .firstChild.setAttribute("style", "zoom: 1 ;opacity: 1 !important");
  } catch {}
  document
    .querySelectorAll("img")
    .forEach((ele) =>
      ele.setAttribute(
        "style",
        " -webkit-filter: invert(100%); -moz-filter: invert(100%); -o-filter: invert(100%); -ms-filter: invert(100%); "
      )
    );
}
try {
  document.body.onkeyup = function (e) {
    if (
      Array.from(document.querySelector("#easebuts").classList).includes(
        "invisible"
      )
    ) {
      onAnswerUpdateRecord();
    }
  };
} catch {}

setInterval(activateDarkMode, 10);

try {
  const css =
    "html {-webkit-filter: invert(100%);" +
    "-moz-filter: invert(100%);" +
    "-o-filter: invert(100%);" +
    "-ms-filter: invert(100%); }";
  const head = document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  if (!window.counter) {
    window.counter = 1;
  } else {
    window.counter++;
    if (window.counter % 2 == 0) {
      const css =
        "html {-webkit-filter: invert(0%); -moz-filter: invert(0%); -o-filter: invert(0%); -ms-filter: invert(0%); }";
    }
  }
  style.type = "text/css";
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
} catch {}
