import { InputBox, Key, VSBrowser,Workbench, TextEditor,EditorView } from "vscode-extension-tester";
import { sleep } from "./util/globalMocks";
import { expect } from "chai";


async function openCommandPaletteAndRun(command: string) {
  const workbench = new Workbench();
  await workbench.openCommandPrompt();
  const inputBox = await InputBox.create();
  await inputBox.setText(command);
  await sleep(500);
  await inputBox.confirm();
  await sleep(2000); // Wait for the command to complete
}

// Opens settings.json via the command palette and returns the TextEditor
async function openSettingsJsonEditor(): Promise<TextEditor> {
  await openCommandPaletteAndRun(">Open User Settings (JSON)");
  const editorView = new EditorView();
  const editor = await editorView.openEditor("settings.json") as TextEditor;
  if (editor) {
    return editor;
  }
  throw new Error("settings.json editor not found!");
}
// const workbench = new Workbench();
//   await workbench.openCommandPrompt();
//   const inputBox = await InputBox.create();
//   await inputBox.setText(">Open User Settings (JSON)");
//   await sleep(500);
//   await inputBox.confirm();
//   await sleep(1000);

async function reloadWindowViaCommandPalette() {
  const workbench = new Workbench();
  await workbench.openCommandPrompt();
  const inputBox = await InputBox.create();
  await inputBox.setText(">Developer: Reload Window");
  await sleep(500);
  await inputBox.confirm();
  await sleep(500); // Give VS Code time to reload
}
// Writes the value to the open settings.json editor and saves the file
async function writeShowAllCommandsInPaletteValue(editor: TextEditor, value: boolean) {
  const settings = JSON.parse(await editor.getText());
  settings["cics-extension-for-zowe.showAllCommandsInPalette"] = value;
  await editor.setText(JSON.stringify(settings, null, 2));
  await sleep(500);

  // Save the file using the command palette
  await openCommandPaletteAndRun(">File: Save");
  await sleep(500);
}

describe("E2E for showAllCommandsInPalette", () => {
  it("Command palette should show all commands when setting is TRUE and hide them when its False", async function () {
    this.timeout(6000000); 
    //Set to true and count

  async function countCicsCommands() {
  // Open Command Palette using keyboard shortcut as contextmenu support is not available
  const driver = VSBrowser.instance.driver;
  await driver.actions().keyDown(Key.COMMAND).sendKeys("P").keyUp(Key.COMMAND).perform();
  const inputBox = await InputBox.create();
  await inputBox.setText(">IBM CICS for Zowe Explorer");
  await sleep(3000);
  const items = await inputBox.getQuickPicks();
  return items.length;
}
  // Open settings.json
    const editor1 = await openSettingsJsonEditor();

    console.log("Setting it to false");
    await writeShowAllCommandsInPaletteValue(editor1, false);
    //await reloadWindowViaCommandPalette();
    const countFalse = await countCicsCommands();
    console.log("Commands when setting is False:", countFalse);
    await editor1.save();
    await sleep(500);

    console.log("Setting it to true");
    await writeShowAllCommandsInPaletteValue(editor1, true);
    await editor1.save();
    //no reloading
    const countTrue = await countCicsCommands();
    console.log("Commands when setting is True:", countTrue);

    await sleep(500000);
    expect(countTrue).to.be.greaterThan(4);
  });
});
