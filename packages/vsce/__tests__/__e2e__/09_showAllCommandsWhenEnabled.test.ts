import { expect } from "chai";
import { countCommandsFromPalette, getCommandPaletteLabels, openSettingsJsonEditor, removeUserSetting, updateUserSetting } from "./util/globalMocks";

describe("Test suite for showing all commands in Command Palette", () => {
  it("Should display more than 5 commands when the property is set to True", async function () {
    await updateUserSetting("zowe.cics.showAllCommandsInPalette", true);
    const countTrue = await countCommandsFromPalette(">Zowe Explorer for IBM CICS Transaction Server");
    const command = ">Zowe Explorer for IBM CICS Transaction Server: Purge Task";
    const labels = await getCommandPaletteLabels(command);
    // Pass the test if the command is present
    expect(countTrue).to.be.greaterThan(6);
    expect(labels).to.include(
      "Zowe Explorer for IBM CICS Transaction Server: Purge Task",
      `Command "Zowe Explorer for IBM CICS Transaction Server: Purge Task" should be present in the palette`
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
