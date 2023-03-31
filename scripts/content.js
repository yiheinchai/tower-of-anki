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

// Game explanation:
// Everyday, players will be able to climb the tower to reach higher floors.
// Each floor has a number of steps. Each step has a question. And as the player climbs the tower, the number of steps in each floor will increase.
// The player will be able to climb the tower by answering questions.
// The higher the floor, the more the steps the player will gain.

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

// A function that calculates the floor, current steps and next steps given total steps
// A function that takes an integer of the steps and returns the floor and the the steps to the next floor
function calculateFloor(steps) {
  // Assume that the floor formula is: floor = Math.floor(Math.sqrt(steps))
  // And the the steps to the next floor formula is: nextStep = (floor + 1) * (floor + 1) - steps
  let floor = Math.floor(Math.sqrt(steps)); // Calculate the floor from the the steps
  let cumulativeStepsAtNextFloor = (floor + 1) * (floor + 1); // Calculate the total the steps required for the next floor
  let cumulativeStepsAtCurrentFloor = floor * floor; // Calculate the total the steps required for the current floor
  let playerStepsAtCurrentFloor = steps - cumulativeStepsAtCurrentFloor; // Calculate the the steps required for the current floor
  let expToNextFloor =
    cumulativeStepsAtNextFloor - cumulativeStepsAtCurrentFloor; // Calculate the the steps required for the next floor
  return [floor, playerStepsAtCurrentFloor, expToNextFloor]; // Return an array with the floor and the the steps to the next floor
}

const XP_MULTIPLIERS = [
  { threshold: 1600, multiplier: 4 },
  { threshold: 800, multiplier: 2.5 },
  { threshold: 300, multiplier: 1.75 },
  { threshold: 100, multiplier: 1.25 },
  { threshold: 0, multiplier: 1 },
];

// A function that takes the number of steps as a parameter and returns the Xp
function calculateXpFromSingleDay(steps) {
  const multiplierWithStepsAboveThresholds = XP_MULTIPLIERS.map(
    (multiplier) => {
      const stepsAboveThreshold =
        steps - multiplier.threshold >= 0 ? steps - multiplier.threshold : 0;
      return { ...multiplier, stepsAboveThreshold };
    }
  );
  // { threshold: 1600, multiplier: 4 }, ABOVE THRESHOLD: 0
  // { threshold: 800, multiplier: 2.5 }, ABOVE THRESHOLD: 200
  // { threshold: 300, multiplier: 1.75 }, ABOVE THRESHOLD: 700
  // { threshold: 100, multiplier: 1.25 }, ABOVE THRESHOLD: 900
  // { threshold: 0, multiplier: 1}, ABOVE THRESHOLD: 1000
  let previousAboveThreshold = 0;
  const totalXp = multiplierWithStepsAboveThresholds.reduce(
    (acc, multiplier) => {
      const xpForMultiplier =
        (multiplier.stepsAboveThreshold - previousAboveThreshold) *
        multiplier.multiplier;

      previousAboveThreshold = multiplier.stepsAboveThreshold;
      return acc + xpForMultiplier;
    },
    0
  );

  return Math.floor(totalXp);
}

// The Xp is caculated based on how many steps the player has accumulated, the more steps within a single day, the more Xp the player will gain
function calculateTotalXp(steps_record) {
  let totalXp = Object.values(steps_record).reduce((totalXp, stepsFromADay) => {
    const xp = calculateXpFromSingleDay(stepsFromADay);
    return totalXp + xp;
  }, 0);
  return totalXp;
}

// The level is calculated based on how much Xp the player has accumulated
// The level is calculated based on the formula: level = Math.floor(Math.sqrt(totalXp) / 3)
function calculateLevel(totalXp) {
  const rawLevel = Math.sqrt(totalXp) / 3;
  const level = Math.floor(Math.sqrt(totalXp) / 3); // Calculate the level from the the steps
  const levelPercentageCompletion = rawLevel - level;
  return [level, levelPercentageCompletion]; // Return an array with the level and the the steps to the next level
}
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
