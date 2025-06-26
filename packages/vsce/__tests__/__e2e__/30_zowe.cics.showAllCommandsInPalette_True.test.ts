import { Workbench, InputBox, EditorView, TextEditor } from "vscode-extension-tester";
import { countCicsCommands, sleep } from "./util/globalMocks";
import { expect } from "chai";
import {openCommandPaletteAndRun} from "./util/globalMocks";

async function openSettingsJsonEditor(): Promise<TextEditor> {
  await sleep(500);
  //await openCommandPaletteAndRun(">__e2e__/settings.json");
  await openCommandPaletteAndRun(">Open User Settings (JSON)");
  const editorView = new EditorView();
  const editor = await editorView.openEditor("settings.json") as TextEditor;
  if (editor) {
    return editor;
  }
  throw new Error("settings.json editor not found!");
}
async function writeShowAllCommandsInPaletteValue(editor: TextEditor, value: boolean) {
  let settings: any = {};
  try {
    settings = JSON.parse(await editor.getText());
  } catch {
    settings = {};
  }
  settings["zowe.cics.showAllCommandsInPalette"] = value;
  await editor.setText(JSON.stringify(settings, null, 2));
  await editor.save();
}

describe("Command palette forbidden command check", () => {
  it("should display 'IBM CICS for Zowe Explorer: Purge Task' in the command palette when the setting is True", async function () {
    const editor1 = await openSettingsJsonEditor();

    console.log("Setting it to True");
    await writeShowAllCommandsInPaletteValue(editor1, true);
    await sleep(500);
    //saving
    await editor1.save();
    //await sleep(50000);
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