import { Given, Then, When } from "@cucumber/cucumber";
import { getCICSContainer, paneDivForTree, installZowe } from "../../../__common__/shared.wdio";

//
// Scenario: User opens and closes the Team Configuration
//

Given(/^a user who is looking at the CICS client$/, async () => {
  //installZowe();
  const cicsContainer = await getCICSContainer();
  const cicsView = await cicsContainer.openView();
  await expect(cicsView).toBeDefined();
  await expect(cicsView.elem).toBeDisplayedInViewport();
});

When(/^user is trying to Create a New Team Configuration file$/, async () => {
  //installZowe();
  const dsPane = await paneDivForTree();
  const plusIcon = await dsPane.getAction(`Create a CICS Profile`);
  await expect(plusIcon).toBeDefined();
  await dsPane.elem.moveTo();
  await expect(plusIcon.elem).toBeClickable();
  await plusIcon.elem.click();
});

//   await browser.waitUntil(() => quickPick.isDisplayed());
//   const createTeamConfigEntry = await quickPick.findItem("＋ Create a New Team Configuration File");
//   await expect(createTeamConfigEntry).toBeClickable();
//   await createTeamConfigEntry.click();
// });

// Then(/^user selects desired location to store configuration file$/, async function () {
//   this.globalCfgOpt = await quickPick.findItem("Global: in the Zowe home directory");
//   await expect(this.globalCfgOpt).toBeDisplayedInViewport();

//   this.projectCfgOpt = await quickPick.findItem("Project: in the current working directory");
//   await expect(this.projectCfgOpt).toBeDisplayedInViewport();
// });

// Then(/^the user can dismiss the dialog$/, async function () {
//   await browser.keys(Key.Escape);
//   await browser.waitUntil((): Promise<boolean> => quickPick.isNotInViewport());
// });
