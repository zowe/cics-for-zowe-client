import {openCommandPaletteAndRun} from "./util/globalMocks";
import { EditorView, TextEditor} from "vscode-extension-tester";
import { sleep } from "./util/globalMocks";
import { expect } from "chai";

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
async function removeShowAllCommandsInPaletteSetting(editor: TextEditor) {
  let settings: any = {};
  try {
    settings = JSON.parse(await editor.getText());
  } catch {
    settings = {};
  }
  if ("zowe.cics.showAllCommandsInPalette" in settings) {
    delete settings["zowe.cics.showAllCommandsInPalette"];
    await editor.setText(JSON.stringify(settings, null, 2));
    await editor.save();
  }
}
describe("Remove the showAllCommandsInPalette setting", () => {
  it("Remove the showAllCommandsInPalette setting", async function () {
    const editor = await openSettingsJsonEditor();
    await removeShowAllCommandsInPaletteSetting(editor);

    // Optionally verify it's removed
    const settings = JSON.parse(await editor.getText());
    expect(settings).to.not.have.property("zowe.cics.showAllCommandsInPalette");
  });
});