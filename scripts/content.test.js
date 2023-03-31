const {
  calculateXpFromSingleDay,
  calculateTotalXp,
  calculateLevel,
} = require("./content.js");

describe("Game Tests", () => {
  test("calculateXpFromSingleDay", () => {
    const xp = calculateXpFromSingleDay(1000);
    expect(xp).toBe(1725);
  });

  test("calculateTotalXp", () => {
    const xp = calculateTotalXp({
      "29/03/2022": 650,
      "30/03/2022": 300,
      "31/03/2022": 800,
    });
    expect(xp).toBe(2537);
  });
  test("calculateLevel", () => {
    const xp = calculateLevel(5000);
    expect(xp).toBe(2537);
  });
});
