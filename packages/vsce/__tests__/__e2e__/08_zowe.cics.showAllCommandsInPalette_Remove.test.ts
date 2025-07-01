import { expect } from "chai";
import {openSettingsJsonEditor,removeShowAllCommandsInPaletteSetting} from "./util/globalMocks";


describe("Remove the showAllCommandsInPalette setting", () => {
  it("Remove the showAllCommandsInPalette setting", async function () {
    const editor = await openSettingsJsonEditor();
    await removeShowAllCommandsInPaletteSetting(editor);

    // Optionally verify it's removed
    const settings = JSON.parse(await editor.getText());
    expect(settings).to.not.have.property("zowe.cics.showAllCommandsInPalette");
  });
});