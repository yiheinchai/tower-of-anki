/**
 * Anki Gamification Script (with Debugging Logs v2)
 * Tracks daily study steps (card answers) and displays progress
 * based on Floors and Levels.
 * - Uses localStorage to persist step counts across sessions.
 * - Updates display dynamically when AnkiWeb interface elements load.
 * - Listens for answer button clicks ("Again", "Hard", "Good", "Easy") to increment steps.
 */

// --- Helper Functions ---

/**
 * Formats a Date object into DD/MM/YYYY string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("Invalid date passed to formatDate:", date);
        const today = new Date();
        date = today; // Fallback to today for calculation, but log the error
    }
    let dd = String(date.getDate()).padStart(2, "0");
    let mm = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
    let yyyy = date.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
}

/**
 * Generates an array of numbers from 1 to x.
 * @param {number} x - The number of elements to generate.
 * @returns {number[]} An array [1, 2, ..., x].
 */
function generateArrayofXElements(x) {
    // Ensure x is a non-negative integer
    x = Math.max(0, Math.floor(x));
    if (!Number.isFinite(x)) {
        console.warn("generateArrayofXElements received non-finite input:", x, ". Using 0.");
        x = 0; // Handle non-finite inputs like NaN
    }
    return Array.from(
        {
            length: x,
        },
        (_, i) => i + 1
    );
}


// --- Display Component ---

/**
 * Generates the HTML for the Floor/Level progress display.
 * @param {number} floor - The current floor number (1-based).
 * @param {number} currentStepInFloor - Steps completed within the current floor (1-based).
 * @param {number} totalStepsForFloor - Total steps required for the current floor.
 * @param {number} level - The current level (0-based).
 * @param {number} levelPercentageCompletion - Percentage completion towards the next level (0 to 1).
 * @returns {string} HTML string for the display component.
 */
function FloorComponent(
    floor,
    currentStepInFloor,
    totalStepsForFloor,
    level,
    levelPercentageCompletion
) {
    // Calculate percentage string safely
    const percentageString = Number.isFinite(levelPercentageCompletion)
        ? Math.floor(levelPercentageCompletion * 100) + '%'
        : '0%'; // Default to 0% if calculation is invalid

    // Ensure totalStepsForFloor is at least 1 for grid generation
    const safeTotalStepsForFloor = Math.max(1, totalStepsForFloor);
    // Ensure currentStepInFloor is within valid bounds [0, totalStepsForFloor]
    const safeCurrentStepInFloor = Math.max(0, Math.min(currentStepInFloor, safeTotalStepsForFloor));

    // Ensure level is non-negative for display
    const displayLevel = Math.max(0, level);
    // Ensure floor is at least 1 for display
    const displayFloor = Math.max(1, floor);

    return `
<div style="display:flex; flex-direction: row; justify-content: center; align-items: center; gap: 0.8rem; margin-top: 5px; margin-bottom: 10px; padding: 5px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;" class="floor_wrapper">
  <div style="white-space: nowrap; font-size: 0.85em; color: #495057;">Lvl ${displayLevel} (${percentageString})</div>
  <div style="white-space: nowrap; font-size: 0.85em; color: #495057;">Floor ${displayFloor}</div>
  <div style="display: grid; grid-template-columns: repeat(${safeTotalStepsForFloor}, 1fr); grid-template-rows: 1fr; height: 0.9rem; width: 100%; border: 1px solid #ced4da; background-color: #e9ecef; border-radius: 3px; overflow: hidden;">
    ${generateArrayofXElements(safeTotalStepsForFloor).reduce((acc, _ele, index) => {
        // Compare 0-based index with 1-based safeCurrentStepInFloor
        if (index < safeCurrentStepInFloor) {
            return (
                acc +
                `<div style="background-color: #28a745;" title="Step ${index + 1}/${safeTotalStepsForFloor}"></div>`
            );
        } else {
            return acc + `<div title="Step ${index + 1}/${safeTotalStepsForFloor}"></div>`;
        }
    }, ``)}
  </div>
</div>
`;
}


// --- Calculation Logic ---

/**
 * Calculates floor, current steps in floor, and total steps for floor based on total steps.
 * @param {number} steps - Total accumulated steps for the day.
 * @returns {[number, number, number]} [Floor number (1-based), Steps made in current floor (1-based), Total steps in current floor]
 */
function calculateFloor(steps) {
    if (steps < 0 || !Number.isFinite(steps)) steps = 0;
    let floor_internal = steps > 0 ? Math.floor(Math.sqrt(steps - 1)) : 0;
    let cumulativeStepsAtCurrentFloorStart = floor_internal * floor_internal;
    let cumulativeStepsAtNextFloorStart = (floor_internal + 1) * (floor_internal + 1);
    let playerStepsInCurrentFloor = steps - cumulativeStepsAtCurrentFloorStart;
    let totalStepsForFloor = cumulativeStepsAtNextFloorStart - cumulativeStepsAtCurrentFloorStart;
    totalStepsForFloor = Math.max(1, totalStepsForFloor);
    playerStepsInCurrentFloor = Math.max(0, Math.min(playerStepsInCurrentFloor, totalStepsForFloor));
    return [floor_internal + 1, playerStepsInCurrentFloor, totalStepsForFloor];
}

// XP thresholds and multipliers
const XP_MULTIPLIERS = [
    { threshold: 1600, multiplier: 4 },
    { threshold: 800, multiplier: 2.5 },
    { threshold: 300, multiplier: 1.75 },
    { threshold: 100, multiplier: 1.25 },
    { threshold: 0, multiplier: 1 },
];

/**
 * Calculates XP gained from a single day's steps.
 * @param {number} steps - Number of steps taken on a single day.
 * @returns {number} Calculated XP for that day (floored).
 */
function calculateXpFromSingleDay(steps) {
    if (steps <= 0 || !Number.isFinite(steps)) return 0;
    let remainingSteps = steps;
    let totalXp = 0;
    const sortedMultipliers = [...XP_MULTIPLIERS].sort((a, b) => b.threshold - a.threshold);
    let previousThreshold = Infinity;
    for (const currentTier of sortedMultipliers) {
        if (remainingSteps > currentTier.threshold) {
            const stepsInThisBand = Math.min(remainingSteps, previousThreshold) - currentTier.threshold;
            if (stepsInThisBand > 0) {
                totalXp += stepsInThisBand * currentTier.multiplier;
            }
        }
        previousThreshold = currentTier.threshold;
    }
    return Math.floor(totalXp);
}

/**
 * Calculates total accumulated XP based on the daily step records.
 * @param {Object.<string, number>} steps_record - Object with date keys and step values.
 * @returns {number} Total accumulated XP.
 */
function calculateTotalXp(steps_record) {
    if (!steps_record || typeof steps_record !== 'object') return 0;
    let totalXp = 0;
    try {
        totalXp = Object.values(steps_record).reduce((currentTotalXp, stepsFromADay) => {
            const xp = calculateXpFromSingleDay(stepsFromADay);
            return currentTotalXp + xp;
        }, 0);
    } catch (e) {
        console.error("Error calculating total XP from records:", e, steps_record);
        return 0;
    }
    return totalXp;
}

/**
 * Calculates the player's level and progress towards the next level based on total XP.
 * @param {number} totalXp - Total accumulated XP.
 * @returns {[number, number]} [Current Level (0-based), Percentage completion towards next level (0-1)]
 */
function calculateLevel(totalXp) {
    if (totalXp < 0 || !Number.isFinite(totalXp)) totalXp = 0;
    const level = Math.floor(Math.sqrt(totalXp) / 3);
    const xpForCurrentLevelStart = 9 * level * level;
    const xpForNextLevelStart = 9 * (level + 1) * (level + 1);
    const xpEarnedInCurrentLevel = totalXp - xpForCurrentLevelStart;
    const xpNeededForLevelUp = xpForNextLevelStart - xpForCurrentLevelStart;
    let levelPercentageCompletion = 0;
    if (xpNeededForLevelUp > 0) {
        levelPercentageCompletion = xpEarnedInCurrentLevel / xpNeededForLevelUp;
    } else if (totalXp > 0) {
        levelPercentageCompletion = 1;
    }
    levelPercentageCompletion = Math.max(0, Math.min(1, levelPercentageCompletion));
    return [level, levelPercentageCompletion];
}


// --- Core Logic: Update Display and Handle Answers (WITH DEBUG LOGS) ---

/**
 * Reads data, calculates progress, and updates the HTML display.
 */
function updateFloorDisplay() {
    console.log("updateFloorDisplay: Function start."); // DEBUG
    let steps_record = {};
    try {
        const storedData = window.localStorage.getItem("steps_record");
        steps_record = storedData ? JSON.parse(storedData) : {};
         if (typeof steps_record !== 'object' || steps_record === null) {
            console.warn("updateFloorDisplay: Invalid steps_record found, resetting.");
            steps_record = {};
         }
         console.log("updateFloorDisplay: Read steps_record:", JSON.stringify(steps_record)); // DEBUG
    } catch (e) {
        console.error("updateFloorDisplay: Failed to parse steps_record", e);
        steps_record = {};
    }

    const todayDate = formatDate(new Date());
    const todaySteps = (typeof steps_record[todayDate] === 'number' && Number.isFinite(steps_record[todayDate]))
                       ? steps_record[todayDate]
                       : 0;
    console.log(`updateFloorDisplay: Today is ${todayDate}, steps for today: ${todaySteps}`); // DEBUG

    let floor, currentStepInFloor, totalStepsInFloor;
    try {
        [floor, currentStepInFloor, totalStepsInFloor] = calculateFloor(todaySteps);
        console.log(`updateFloorDisplay: Calculated Floor: ${floor}, Current Step: ${currentStepInFloor}, Total Steps: ${totalStepsInFloor}`); // DEBUG
    } catch (e) {
        console.error("updateFloorDisplay: Error calculating floor:", e);
        floor = 1; currentStepInFloor = 0; totalStepsInFloor = 1;
    }

    let totalXp = 0;
    try {
        totalXp = calculateTotalXp(steps_record);
         console.log(`updateFloorDisplay: Calculated Total XP: ${totalXp}`); // DEBUG
    } catch (e) {
        console.error("updateFloorDisplay: Error calculating total XP:", e);
    }

    let level, levelPercentageCompletion;
    try {
        [level, levelPercentageCompletion] = calculateLevel(totalXp);
         console.log(`updateFloorDisplay: Calculated Level: ${level}, Completion: ${levelPercentageCompletion}`); // DEBUG
    } catch (e) {
        console.error("updateFloorDisplay: Error calculating level:", e);
        level = 0; levelPercentageCompletion = 0;
    }

    const displayContainer = document.querySelector(".pt-1");
    if (displayContainer) {
        // Find or create our specific wrapper within the container using the added class
        let floorDisplayElement = displayContainer.querySelector(".floor_wrapper_container");
        if (!floorDisplayElement) {
            console.log("updateFloorDisplay: Creating floorDisplayElement container."); // DEBUG
            floorDisplayElement = document.createElement('div');
            floorDisplayElement.classList.add("floor_wrapper_container"); // Add class to the container div itself
            displayContainer.prepend(floorDisplayElement);
        }

        try {
            const componentHTML = FloorComponent(
                floor, currentStepInFloor, totalStepsInFloor, level, levelPercentageCompletion
            );
            console.log("updateFloorDisplay: Rendering component HTML."); // DEBUG
            // The componentHTML itself includes the .floor_wrapper class now
            floorDisplayElement.innerHTML = componentHTML;
        } catch (e) {
            console.error("updateFloorDisplay: Error rendering FloorComponent:", e);
            floorDisplayElement.innerHTML = `<div style="color: red; text-align: center; font-size: 0.8em; padding: 5px;">Error displaying floor progress.</div>`;
        }
    } else {
        console.warn("updateFloorDisplay: Target element '.pt-1' not found."); // Expected initially
    }
     console.log("updateFloorDisplay: Function end."); // DEBUG
}


/**
 * Called when a grading button ("Again", "Hard", "Good", "Easy") is clicked.
 * Increments today's step count and updates display.
 */
function onAnswerUpdateRecord() {
    console.log("onAnswerUpdateRecord: Function start."); // DEBUG
    let steps_record = {};
    try {
        const storedData = window.localStorage.getItem("steps_record");
        steps_record = storedData ? JSON.parse(storedData) : {};
         if (typeof steps_record !== 'object' || steps_record === null) {
            steps_record = {};
         }
         console.log("onAnswerUpdateRecord: Read steps_record:", JSON.stringify(steps_record)); // DEBUG
    } catch (e) {
        console.error("onAnswerUpdateRecord: Failed to parse steps_record", e);
        steps_record = {};
    }

    const todayDate = formatDate(new Date());
    console.log(`onAnswerUpdateRecord: Today is ${todayDate}`); // DEBUG

    let currentSteps = 0;
    // Ensure we get a valid number for current steps, default to 0
    if (typeof steps_record[todayDate] === 'number' && Number.isFinite(steps_record[todayDate])) {
        currentSteps = steps_record[todayDate];
    }
    console.log(`onAnswerUpdateRecord: Steps before increment for ${todayDate}: ${currentSteps}`); // DEBUG

    // Increment today's steps
    steps_record[todayDate] = currentSteps + 1;
    console.log(`onAnswerUpdateRecord: Steps AFTER increment for ${todayDate}: ${steps_record[todayDate]}`); // DEBUG

    // Save updated record back to localStorage
    try {
        const dataToSave = JSON.stringify(steps_record);
        console.log("onAnswerUpdateRecord: Attempting to save:", dataToSave); // DEBUG
        window.localStorage.setItem("steps_record", dataToSave);
        console.log("onAnswerUpdateRecord: Successfully saved to localStorage."); // DEBUG
    } catch (e) {
        console.error("onAnswerUpdateRecord: Failed to save steps_record to localStorage", e);
    }

    // Update the display AFTER saving the new count
    console.log("onAnswerUpdateRecord: Calling updateFloorDisplay..."); // DEBUG
    updateFloorDisplay();
     console.log("onAnswerUpdateRecord: Function end."); // DEBUG
}


// --- Initialization and Event Listener Setup Function (WITH DEBUG LOGS & REVISED LISTENER LOGIC) ---

/**
 * Checks for required elements and sets up initial display and listeners.
 * @returns {boolean} True if setup was successful, False otherwise.
 */
function setupGamification() {
    console.log("setupGamification: Attempting to set up elements..."); // DEBUG

    const displayTarget = document.querySelector(".pt-1");
    const answerArea = document.querySelector("#ansarea");

    if (!displayTarget) {
        console.log("setupGamification: .pt-1 not found yet.");
        return false;
    }
    if (!answerArea) {
        console.log("setupGamification: #ansarea not found yet.");
        return false;
    }

    console.log("setupGamification: Found required elements. Finalizing setup.");

    // 1. Initial display update
    updateFloorDisplay();

    // 2. Add the click listener
    if (!answerArea.dataset.gamificationListenerAdded) {
         console.log("setupGamification: Adding click listener to #ansarea."); // DEBUG
         answerArea.addEventListener('click', function (event) {
            console.log("setupGamification: Click detected inside #ansarea."); // DEBUG

            const targetButton = event.target.closest('button.btn-primary');
            console.log("setupGamification: Click target:", event.target, "Closest button:", targetButton); // DEBUG

            if (targetButton) { // If a primary button was clicked within the listener's scope...

                // Check if it's one of the ACTUAL grading buttons (Again, Hard, Good, Easy)
                // These seem to have the 'm-1' class in the logs provided.
                if (targetButton.classList.contains('m-1')) {
                     console.log("setupGamification: Grading button click confirmed (has m-1 class). Calling onAnswerUpdateRecord."); // DEBUG
                     onAnswerUpdateRecord();
                } else if (targetButton.textContent.trim() === 'Show Answer') {
                     // Specifically ignore the "Show Answer" button
                     console.log("setupGamification: 'Show Answer' button clicked. Ignoring for step count."); // DEBUG
                } else {
                     // It's a primary button, but not one we recognize as a grading button or "Show Answer"
                     console.log("setupGamification: Unrecognized primary button clicked:", targetButton.textContent); // DEBUG
                }
            } else {
                // The click wasn't on or inside a primary button
                console.log("setupGamification: Click was not on or inside a primary button."); // DEBUG
            }
         });
        answerArea.dataset.gamificationListenerAdded = 'true'; // Mark as added
    } else {
        console.log("setupGamification: Click listener already present.");
    }

     console.log("setupGamification: Setup successful."); // DEBUG
    return true;
}


// --- Main Execution Logic ---
console.log("Anki Gamification Script Loaded. Initializing... v2");

// Use a flag to prevent multiple initializations if script is injected multiple times
if (!window.ankiGamificationInitialized) {
    window.ankiGamificationInitialized = true;

    // Try to set up immediately. If it works (elements are already there), great.
    if (!setupGamification()) {
        // If setup failed, elements aren't ready. Use MutationObserver to wait.
        console.log("Initial setup failed (elements not ready). Starting MutationObserver to wait for AnkiWeb UI."); // DEBUG

        // Select a stable parent element that exists early and will eventually contain the targets.
        const observerTargetNode = document.querySelector('main.container') || document.body;
        const observerConfig = {
            childList: true, // Watch for additions/removals of children
            subtree: true    // Watch descendants too
        };

        let observer = null; // Define observer variable in this scope

        const mutationCallback = (mutationsList, obs) => {
            // Simply try setting up again whenever *any* change occurs within the target.
            console.log("DOM mutation detected, checking for elements again..."); // DEBUG
            if (setupGamification()) {
                // Setup successful!
                console.log("MutationObserver successfully triggered setup. Disconnecting observer."); // DEBUG
                obs.disconnect(); // Stop observing now that setup is complete.
                observer = null; // Clear observer variable
            }
        };

        // Create and start the observer
        observer = new MutationObserver(mutationCallback);
        observer.observe(observerTargetNode, observerConfig);
        console.log(`Observer started on ${observerTargetNode.tagName}${observerTargetNode.id ? '#'+observerTargetNode.id : ''}${observerTargetNode.className ? '.'+observerTargetNode.className.replace(/ /g,'.') : ''}`); // DEBUG

        // Optional: Safeguard timeout
        setTimeout(() => {
            if (observer) { // Check if observer is still active
                console.warn("Observer safeguard timeout (30s) reached. Disconnecting observer."); // DEBUG
                observer.disconnect();
                observer = null;
            }
        }, 30000); // 30 seconds

    } else {
        // Setup succeeded on the first try
        console.log("Gamification setup complete on initial attempt."); // DEBUG
    }
} else {
    console.log("Anki Gamification Script already initialized. Skipping setup."); // DEBUG
}
