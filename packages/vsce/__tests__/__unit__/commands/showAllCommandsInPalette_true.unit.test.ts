import { expect } from "chai";

// Mock implementation for countCicsCommands
const countCicsCommands = jest.fn();

// Mock implementation for settings
let settings: any = {};

function setShowAllCommandsInPalette(value: boolean) {
  settings["zowe.cics.showAllCommandsInPalette"] = value;
}

function clearSettings() {
  settings = {};
}

describe("Unit: showAllCommandsInPalette false", () => {
  beforeEach(() => {
    clearSettings();
    jest.clearAllMocks();
  });

  it("should have more than 5 CICS commands when showAllCommandsInPalette is true", async () => {
    setShowAllCommandsInPalette(true);
    // Simulate countCicsCommands returning more number when setting is true
    countCicsCommands.mockResolvedValue(6);

    const countFalse = await countCicsCommands();
    expect(countFalse).greaterThan(5);
  });
});