import { expect } from "chai";
import { countCommandsFromPalette, getCommandPaletteLabels, updateUserSetting } from "./util/globalMocks";

describe("Test suite for showing Limited commands in Command Palette", () => {
  it("Should display less than 6 commands when the property is set to False", async function () {
    await updateUserSetting("zowe.cics.showAllCommandsInPalette", false);
    const countFalse = await countCommandsFromPalette(">Zowe Explorer for IBM CICS Transaction Server");
    const command = ">Zowe Explorer for IBM CICS Transaction Server: Purge Task";
    const labels = await getCommandPaletteLabels(command);
    // Pass the test if the command is present
    expect(countFalse).to.be.lessThan(6);
    expect(labels).to.not.include(
      "Zowe Explorer for IBM CICS Transaction Server: Purge Task",
      `Command "Zowe Explorer for IBM CICS Transaction Server: Purge Task" should NOT be present in the palette`
    );
    await updateUserSetting("zowe.cics.showAllCommandsInPalette", true);
  });
});
