import { countCommandsFromPalette} from "./util/globalMocks";
import { expect } from "chai";
import {getCommandPaletteLabels,updateUserSetting} from "./util/globalMocks";

describe("Test suite for showing Limited commands in Command Palette", () => {
  it("Should display less than 6 commands when the property is set to False", async function () {
    await updateUserSetting("zowe.cics.showAllCommandsInPalette",false);
    const countFalse = await countCommandsFromPalette(">IBM CICS for Zowe Explorer");
    const command = ">IBM CICS for Zowe Explorer: Purge Task";
    const labels = await getCommandPaletteLabels(command);
    // Pass the test if the command is present
    expect(countFalse).to.be.lessThan(6);
    expect(labels).to.not.include(
      "IBM CICS for Zowe Explorer: Purge Task",
      `Command "IBM CICS for Zowe Explorer: Purge Task" should NOT be present in the palette`
    );
    await updateUserSetting("zowe.cics.showAllCommandsInPalette",true);
  });
});