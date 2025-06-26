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

  describe("E2E for showAllCommandsInPalette: False", () => {
  it("Command palette should show hide them when its False", async function () {
    const editor1 = await openSettingsJsonEditor();

    console.log("Setting it to false");
    await writeShowAllCommandsInPaletteValue(editor1, false);
    await sleep(500);

    await editor1.save();
 
    const countFalse = await countCicsCommands();
    console.log("Commands when setting is False:", countFalse);

    await sleep(500);
    expect(countFalse).lessThan(5);
  });
  });


