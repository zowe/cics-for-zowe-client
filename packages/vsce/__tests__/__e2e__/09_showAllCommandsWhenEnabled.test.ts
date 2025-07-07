import { countCommandsFromPalette, removeUserSetting} from "./util/globalMocks";
import { expect } from "chai";
import {openSettingsJsonEditor,updateUserSetting,getCommandPaletteLabels} from "./util/globalMocks";

describe("Test suite for showing all commands in Command Palette", () => {
  it("Should display more than 5 commands when the property is set to True", async function () {
    await updateUserSetting("zowe.cics.showAllCommandsInPalette",true);
    const countTrue = await countCommandsFromPalette(">IBM CICS for Zowe Explorer");
    const command = ">IBM CICS for Zowe Explorer: Purge Task";
    const labels = await getCommandPaletteLabels(command);
    // Pass the test if the command is present
    expect(countTrue).to.be.greaterThan(6);
    expect(labels).to.include(
      "IBM CICS for Zowe Explorer: Purge Task",
      `Command "IBM CICS for Zowe Explorer: Purge Task" should be present in the palette`
    );
  });
});
describe("Remove the showAllCommandsInPalette setting", () => {
  it("Remove the showAllCommandsInPalette setting", async function () {
    const editor = await openSettingsJsonEditor();
    await removeUserSetting("zowe.cics.showAllCommandsInPalette");
    // Optionally verify it's removed
    const settings = JSON.parse(await editor.getText());
    expect(settings).to.not.have.property("zowe.cics.showAllCommandsInPalette");
  });
});
