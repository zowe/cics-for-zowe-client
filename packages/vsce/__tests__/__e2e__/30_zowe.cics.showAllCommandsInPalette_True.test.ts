import { Workbench, InputBox} from "vscode-extension-tester";
import { countCicsCommands, sleep } from "./util/globalMocks";
import { expect } from "chai";
import {openSettingsJsonEditor,writeShowAllCommandsInPaletteValue} from "./util/globalMocks";

describe("Command Palette when the value is set to True", () => {
  it("should display 'IBM CICS for Zowe Explorer: Purge Task' in the command palette when the setting is True", async function () {
    const editor1 = await openSettingsJsonEditor();

    console.log("Setting it to True");
    await writeShowAllCommandsInPaletteValue(editor1, true);
    await sleep(500);
    //saving
    await editor1.save();
    //await sleep(500);
    const countTrue = await countCicsCommands();
    console.log("Commands when setting is True:", countTrue);
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
    expect(labels).to.include(
      "IBM CICS for Zowe Explorer: Purge Task",
      `Command "IBM CICS for Zowe Explorer: Purge Task" should be present in the palette`
    );
  });
});