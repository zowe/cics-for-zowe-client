import { InputBox, Workbench } from "vscode-extension-tester";
import { DefaultTreeSection, QuickPickItem, SideBarView} from "vscode-extension-tester";
import { workspace, ConfigurationTarget } from "vscode";
import { sleep } from "./util/globalMocks";
import {
  getCicsSection,
  openZoweExplorer,
} from "./util/initSetup.test";

describe("E2E for Show All Commands In Palette", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let qpItems: QuickPickItem[];
  beforeEach(async () => {
    await sleep(1000);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
  });
  it("should test both Show All Commands In Palette scenarios", async () => {
    const config = workspace.getConfiguration("cics-extension-for-zowe");
    let current = config.get<boolean>("Show All Commands In Palette");

    // Helper to open palette and count commands
    async function countCicsCommands() {
      const workbench = new Workbench();
      await workbench.openCommandPrompt();
      const inputBox = await InputBox.create();
      await inputBox.setText("IBM CICS for Zowe Explorer");
      await sleep(500);
      const items = await inputBox.getQuickPicks();
      return items.length;
    }

    if (current === true) {
      await config.update("Show All Commands In Palette", false, ConfigurationTarget.Global);
      await sleep(1000);
      let count = await countCicsCommands();
      console.log("Commands when setting is FALSE (should be hidden):", count);

      await config.update("Show All Commands In Palette", true, ConfigurationTarget.Global);
      await sleep(1000);
      count = await countCicsCommands();
      console.log("Commands when setting is TRUE (should be visible):", count);
    } else {
      await config.update("Show All Commands In Palette", true, ConfigurationTarget.Global);
      await sleep(1000);
      let count = await countCicsCommands();
      console.log("Commands when setting is TRUE (should be visible):", count);

      await config.update("Show All Commands In Palette", false, ConfigurationTarget.Global);
      await sleep(1000);
      count = await countCicsCommands();
      console.log("Commands when setting is FALSE (should be hidden):", count);
    }
  });
});