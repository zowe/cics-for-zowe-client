import { Workbench, InputBox } from "vscode-extension-tester";
import { countCicsCommands, sleep } from "./util/globalMocks";
import { expect } from "chai";
import {openSettingsJsonEditor,writeShowAllCommandsInPaletteValue} from "./util/globalMocks";

describe("Command Palette when the enviroment variable in settings.json is set to False", () => {
  it("Should not display 'IBM CICS for Zowe Explorer: Purge Task' in the command palette when the setting is False", async function () {
    const editor1 = await openSettingsJsonEditor();

    await writeShowAllCommandsInPaletteValue(editor1, false);
    await sleep(500);
    //saving
    await editor1.save();
  
    const countFalse = await countCicsCommands();
    console.log("Number of commands when the enviroment variable in settings.json is set to False(Expecting lesser than 5 commands):", countFalse);
    const command = ">IBM CICS for Zowe Explorer: Purge Task";

    const workbench = new Workbench();
    await workbench.openCommandPrompt();
    const inputBox = await InputBox.create();

  // Type the command (do NOT confirm)
    await inputBox.setText(command);
    await sleep(2000);

    // Collect the quick picks
    const items = await inputBox.getQuickPicks();
    const labels = await Promise.all(items.map(i => i.getLabel()));

    // Pass the test if the command is present
    expect(countFalse).to.be.lessThan(6);
    expect(labels).to.not.include(
      "IBM CICS for Zowe Explorer: Purge Task",
      `Command "IBM CICS for Zowe Explorer: Purge Task" should NOT be present in the palette`
    );
  });
});
