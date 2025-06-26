import { EditorView, TextEditor} from "vscode-extension-tester";
import { countCicsCommands, sleep } from "./util/globalMocks";
import { expect } from "chai";
import {openCommandPaletteAndRun} from "./util/globalMocks";

async function openSettingsJsonEditor(): Promise<TextEditor> {
  await sleep(500);
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
describe("E2E for showAllCommandsInPalette: True", () => {
 it("Command palette should show hide them when its True", async function () {
    //this.timeout(6000000);
    // Open settings.json
    const editor1 = await openSettingsJsonEditor();

    console.log("Setting it to True");
    await writeShowAllCommandsInPaletteValue(editor1, true);
    await sleep(500);
    await editor1.save();
    //await sleep(50000);
    const countTrue = await countCicsCommands();
    console.log("Commands when setting is True:", countTrue);

    await sleep(500);
    expect(countTrue).greaterThan(5);
  });
});
