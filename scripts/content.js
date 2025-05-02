// --- Helper Functions (Unchanged) ---

function formatDate(date) {
    let dd = String(date.getDate()).padStart(2, "0");
    let mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = date.getFullYear();
    return dd + "/" + mm + "/" + yyyy;
}

function generateArrayofXElements(x) {
    // Ensure x is a positive integer
    x = Math.max(0, Math.floor(x));
    if (!Number.isFinite(x)) {
        x = 0; // Handle non-finite inputs
    }
    return Array.from(
        {
            length: x,
        },
        (_, i) => i + 1
    );
}


// --- Display Component (Mostly Unchanged) ---

function FloorComponent(
    floor,
    currentStepInFloor,
    totalStepsForFloor,
    level,
    levelPercentageCompletion // Added levelPercentageCompletion here
) {
    // Calculate percentage string safely
    const percentageString = Number.isFinite(levelPercentageCompletion)
        ? Math.floor(levelPercentageCompletion * 100) + '%'
        : '0%'; // Default to 0% if calculation is invalid

    // Ensure totalStepsForFloor is at least 1 for grid generation
    const safeTotalStepsForFloor = Math.max(1, totalStepsForFloor);
    // Ensure currentStepInFloor is within valid bounds [0, totalStepsForFloor]
    const safeCurrentStepInFloor = Math.max(0, Math.min(currentStepInFloor, totalStepsForFloor));


    return `
<div style="display:flex; flex-direction: row; justify-content: center; align-items: center; gap: 1rem; margin-top: 5px; margin-bottom: 5px;" class="floor_wrapper">
  <div style="white-space: nowrap; font-size: 0.9em;">Lvl ${level} (${percentageString})</div>
  <div style="white-space: nowrap; font-size: 0.9em;">Floor ${floor}</div>
  <div style="display: grid; grid-template-columns: repeat(${safeTotalStepsForFloor}, 1fr); grid-template-rows: 1fr; height: 1rem; width: 100%; border: 1px solid #ccc; background-color: #f8f9fa; border-radius: 3px; overflow: hidden;">
    ${generateArrayofXElements(safeTotalStepsForFloor).reduce((acc, ele, index) => {
        // Use index directly, as ele starts from 1 but index starts from 0
        // We want to fill up to and including the currentStepInFloor index
        // Adjust comparison: steps are 1-based, index is 0-based
        // safeCurrentStepInFloor is 1-based for calculation result, adjust for 0-based index
        if (index < safeCurrentStepInFloor) {
            return (
                acc +
                // Use a brighter green, remove individual borders for a smoother look
                `<div style="background-color: #28a745;"></div>`
            );
        } else {
            // Empty div for unfilled steps (background color from parent shows through)
            return acc + `<div></div>`;
        }
    }, ``)}
  </div>
</div>
`;
}


// --- Calculation Logic (Unchanged) ---

function calculateFloor(steps) {
    if (steps < 0 || !Number.isFinite(steps)) steps = 0; // Handle invalid steps
    let floor = steps > 0 ? Math.floor(Math.sqrt(steps - 1)) : 0;
    let cumulativeStepsAtCurrentFloorStart = floor * floor;
    let cumulativeStepsAtNextFloorStart = (floor + 1) * (floor + 1);

    let playerStepsInCurrentFloor = steps - cumulativeStepsAtCurrentFloorStart;
    let totalStepsForFloor = cumulativeStepsAtNextFloorStart - cumulativeStepsAtCurrentFloorStart;

    // Ensure totalStepsForFloor is at least 1, especially for floor 0 (which needs 1 step)
    totalStepsForFloor = Math.max(1, totalStepsForFloor);
    // Ensure playerStepsInCurrentFloor doesn't exceed totalStepsForFloor
    playerStepsInCurrentFloor = Math.min(playerStepsInCurrentFloor, totalStepsForFloor);


    // Return floor (1-based), steps *made* in this floor, total steps *required* for this floor
    return [floor + 1, playerStepsInCurrentFloor, totalStepsForFloor];
}


const XP_MULTIPLIERS = [
    { threshold: 1600, multiplier: 4 },
    { threshold: 800, multiplier: 2.5 },
    { threshold: 300, multiplier: 1.75 },
    { threshold: 100, multiplier: 1.25 },
    { threshold: 0, multiplier: 1 },
];

function calculateXpFromSingleDay(steps) {
    if (steps <= 0 || !Number.isFinite(steps)) return 0;

    let remainingSteps = steps;
    let totalXp = 0;
    // Sort multipliers by threshold descending to process highest first
    const sortedMultipliers = [...XP_MULTIPLIERS].sort((a, b) => b.threshold - a.threshold);

    let previousThreshold = Infinity; // Start with infinity for the highest tier

    for (const currentTier of sortedMultipliers) {
        if (remainingSteps > currentTier.threshold) {
            // Calculate steps that fall *strictly between* currentTier.threshold and previousThreshold
            const stepsInThisBand = Math.min(remainingSteps, previousThreshold) - currentTier.threshold;
            if (stepsInThisBand > 0) {
                 totalXp += stepsInThisBand * currentTier.multiplier;
            }
        }
         previousThreshold = currentTier.threshold; // Update for the next iteration
         if (remainingSteps <= currentTier.threshold) {
             // Optimization: if remaining steps are below the current threshold, they are also below all subsequent lower thresholds.
             // However, the loop needs to continue to potentially apply the base multiplier (threshold 0).
             // A break here would be wrong if the threshold 0 tier hasn't been processed yet.
         }
    }

    return Math.floor(totalXp);
}


function calculateTotalXp(steps_record) {
    if (!steps_record || typeof steps_record !== 'object') return 0;
    let totalXp = Object.values(steps_record).reduce((totalXp, stepsFromADay) => {
        const xp = calculateXpFromSingleDay(stepsFromADay);
        return totalXp + xp;
    }, 0);
    return totalXp;
}

function calculateLevel(totalXp) {
    if (totalXp < 0 || !Number.isFinite(totalXp)) totalXp = 0;
    const rawLevel = Math.sqrt(totalXp) / 3;
    const level = Math.floor(rawLevel);

    const xpForCurrentLevel = 9 * level * level;
    const xpForNextLevel = 9 * (level + 1) * (level + 1);
    const xpEarnedInCurrentLevel = totalXp - xpForCurrentLevel;
    const xpNeededForLevelUp = xpForNextLevel - xpForCurrentLevel;

    const levelPercentageCompletion = (xpNeededForLevelUp > 0) ? (xpEarnedInCurrentLevel / xpNeededForLevelUp) : (level > 0 ? 1 : 0); // If needed is 0, completion is 100% unless at level 0

    // Return level (using 0-based internally, display might add 1), percentage
    return [level, levelPercentageCompletion];
}


// --- Core Logic (Update Display and Handle Answer) ---

function updateFloorDisplay() {
    let steps_record = {};
    try {
        steps_record = JSON.parse(window.localStorage.getItem("steps_record")) || {};
    } catch (e) {
        console.error("Failed to parse steps_record from localStorage", e);
        steps_record = {};
    }

    const todayDate = formatDate(new Date());
    const todaySteps = steps_record[todayDate] || 0;

    let floor, currentStepInFloor, totalStepsInFloor;
    try {
        [floor, currentStepInFloor, totalStepsInFloor] = calculateFloor(todaySteps);
    } catch (e) {
        console.error("Error calculating floor:", e);
        floor = 1;
        currentStepInFloor = 0;
        totalStepsInFloor = 1; // Default to prevent errors in FloorComponent
    }

    let totalXp = 0;
    try {
        totalXp = calculateTotalXp(steps_record);
    } catch (e) {
        console.error("Error calculating total XP:", e);
    }

    let level, levelPercentageCompletion;
    try {
        [level, levelPercentageCompletion] = calculateLevel(totalXp);
    } catch (e) {
        console.error("Error calculating level:", e);
        level = 0;
        levelPercentageCompletion = 0;
    }

    // Target element for display - check if it exists
    const displayContainer = document.querySelector(".pt-1");
    if (displayContainer) {
        // Check if our display element already exists to avoid duplicates
        let floorDisplayElement = displayContainer.querySelector(".floor_wrapper");
        if (!floorDisplayElement) {
            // Create a container for our component if it doesn't exist
            floorDisplayElement = document.createElement('div');
            displayContainer.appendChild(floorDisplayElement);
        }

        try {
            // Update the innerHTML of our specific container
            floorDisplayElement.innerHTML = FloorComponent(
                floor,
                currentStepInFloor,
                totalStepsInFloor,
                level, // Pass the calculated level (0-based from calc)
                levelPercentageCompletion
            );
        } catch (e) {
            console.error("Error rendering FloorComponent:", e);
            floorDisplayElement.innerHTML = `<div style="color: red; text-align: center;">Error displaying floor progress.</div>`;
        }
    } else {
        console.warn("Target element '.pt-1' not found for floor display.");
    }
}


function onAnswerUpdateRecord() {
    console.log("Answer button clicked, updating record..."); // Debug log
    let steps_record = {};
    try {
        steps_record = JSON.parse(window.localStorage.getItem("steps_record")) || {};
    } catch (e) {
        console.error("Failed to parse steps_record from localStorage", e);
        steps_record = {};
    }

    const todayDate = formatDate(new Date());

    if (typeof steps_record[todayDate] !== 'number' || !Number.isFinite(steps_record[todayDate])) {
        steps_record[todayDate] = 0;
    }

    steps_record[todayDate]++;
    console.log(`Steps for ${todayDate}: ${steps_record[todayDate]}`); // Debug log

    try {
        window.localStorage.setItem("steps_record", JSON.stringify(steps_record));
    } catch (e) {
        console.error("Failed to save steps_record to localStorage", e);
    }

    updateFloorDisplay();
}

// --- Initialization and Event Listener Setup (Updated Part) ---

function initializeGamification() {
    console.log("Initializing Anki Gamification Script...");

    // Initial display update on load
    updateFloorDisplay();

    // Set up event listener for answer button clicks
    const ansArea = document.querySelector("#ansarea");

    if (ansArea) {
        console.log("Found #ansarea. Adding click listener.");
        // Use event delegation on the container
        ansArea.addEventListener('click', function (event) {
            // Check if the clicked element is a button within the #ansarea
            const targetButton = event.target.closest('button'); // Find the nearest button ancestor or self
            if (targetButton && ansArea.contains(targetButton)) {
                 // Check if it's one of the primary action buttons (Again, Hard, Good, Easy)
                 // This check might be redundant if only these buttons exist here, but adds robustness
                 if (targetButton.classList.contains('btn-primary')) {
                    onAnswerUpdateRecord();
                 }
            }
        });
    } else {
        // AnkiWeb might load content dynamically. If #ansarea isn't present immediately,
        // we might need to wait or use a MutationObserver on a higher-level element (like 'main' or 'body')
        // to detect when #ansarea is added to the DOM.
        console.warn("#ansarea element not found on initial load. Retrying setup or listener might fail.");

        // Simple retry mechanism: Check again after a short delay
        setTimeout(() => {
            const ansAreaRetry = document.querySelector("#ansarea");
            if (ansAreaRetry) {
                console.log("Found #ansarea on retry. Adding click listener.");
                 ansAreaRetry.addEventListener('click', function (event) {
                    const targetButton = event.target.closest('button');
                    if (targetButton && ansAreaRetry.contains(targetButton) && targetButton.classList.contains('btn-primary')) {
                         onAnswerUpdateRecord();
                    }
                 });
                 // Update display again in case it wasn't fully ready before
                 updateFloorDisplay();
            } else {
                 console.error("#ansarea element still not found after delay. Button clicks won't be tracked.");
            }
        }, 2000); // Wait 2 seconds
    }
}

// Run the initialization function
// Use DOMContentLoaded to ensure the basic DOM is ready, though dynamic content might still load later.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGamification);
} else {
    // The DOMContentLoaded event has already fired
    initializeGamification();
}


// --- Optional: Clean up module export if not needed ---
// module.exports = {
//   calculateXpFromSingleDay,
//   calculateTotalXp,
//   calculateLevel,
// };
