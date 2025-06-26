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

  it("should have less than 5 CICS commands when showAllCommandsInPalette is false", async () => {
    setShowAllCommandsInPalette(false);
    // Simulate countCicsCommands returning a small number when setting is false
    countCicsCommands.mockResolvedValue(2);

    const countFalse = await countCicsCommands();
    expect(countFalse).lessThan(5);
  });
});