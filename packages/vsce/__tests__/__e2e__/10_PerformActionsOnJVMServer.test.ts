/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { expect } from "chai";
import { DefaultTreeSection, NotificationType, SideBarView, TreeItem, Workbench } from "vscode-extension-tester";
import { JAHAGWLP, CICSEX61, IYCWENW2, JVMSERVERS, WIREMOCK_PROFILE_NAME, JVMEWLP,JVMDIWLP } from "./util/constants";
import { findJVMServerTreeNodeByLabel, sleep, updateUserSetting, openCommandPaletteAndType, sendArrowDownKeyAndPressEnter} from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  clickRefreshIconInCicsTree,
  closeAllEditorsTabs,
  collapseSectionInZoweExplorer,
  getCicsSection,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Perform Actions On JVM Servers", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsPlexChildren: TreeItem[];
  let regionIndex: number;
  let regions: TreeItem[];
  let regionIIYCWENW2ndex: number;
  let regionResources: TreeItem[];
  let jvmResourceIndex: number;
  let jvmservers: TreeItem[];

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();

    await collapseSectionInZoweExplorer(view, "Data Sets");
    await collapseSectionInZoweExplorer(view, "Unix System Services (USS)");
    await collapseSectionInZoweExplorer(view, "Jobs");

    cicsTree = await getCicsSection(view);
    await clickRefreshIconInCicsTree(cicsTree);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await updateUserSetting("zowe.cics.showAllCommandsInPalette",true);

  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Performing Disable And Enable On JVM Server CICSEX61 -> IYCWENW2 -> JVM Servers", () => {
    let JAHAGWLPJVMServer: TreeItem | undefined;
    let JVMDIWLPJVMServer: TreeItem | undefined;
    let JVMEWLPJVMServer: TreeItem | undefined;

    it("Verify CICSEX61 -> Regions -> IYCWENW2 -> JVM Servers", async () => {
      ({
        cicsPlexChildren,
        regionIndex,
        regions,
        selectedRegionIndex: regionIIYCWENW2ndex,
        selectedRegionResources: regionResources,
        selectedResourceIndex: jvmResourceIndex,
        selectedResource: jvmservers,
      } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, IYCWENW2, JVMSERVERS));

      cicsTree.takeScreenshot();
      await resetAllScenarios();

    });

    it("Verify JVM Servers -> JAHAGWLP", async () => {
      JAHAGWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, JAHAGWLP);
      expect(JAHAGWLPJVMServer).not.undefined;
      expect(await JAHAGWLPJVMServer?.getLabel()).contains(JAHAGWLP);
      cicsTree.takeScreenshot();
      await resetAllScenarios();
    });

    it("Check Disable JVM Server Options", async () => {
        await resetAllScenarios();
                
        // with the small screen size, we're off the bottom of the page
        cicsTree = await getCicsSection(view);
        await sendArrowDownKeyAndPressEnter(10);

        await JAHAGWLPJVMServer?.click();

        // Now select the disable command from the command palette
        const inputBoxforcommand = await openCommandPaletteAndType(">IBM CICS for Zowe Explorer: Disable JVM Server");
        await inputBoxforcommand.confirm();

        // Notification pops up
        const inputBoxfornotification = await openCommandPaletteAndType(">Notifications: Focus Notification Toast");
        await inputBoxfornotification.confirm();
        await sleep(500);

        // Check the notification has 4 disable methods
        const workbench = new Workbench();
        const notificationsCenter = await workbench.openNotificationsCenter();
        const notificationspurge = await notificationsCenter.getNotifications(NotificationType.Any);
        const notification = notificationspurge.find(
            async n => (await n.getMessage()).includes("Choose how to purge tasks while disabling the JVM server")
        );
        if (notification) {
            const actions = await notification.getActions();
            console.log('Available actions:', await Promise.all(actions.map(a => a.getText())));
            expect(actions.length).to.be.gte(4);
            expect(await actions[0].getText()).to.equal("Phase Out");
            expect(await actions[1].getText()).to.equal("Purge");
            expect(await actions[2].getText()).to.equal("Force Purge");
            expect(await actions[3].getText()).to.equal("Kill");
        }
      });

    it("Disable JVM Server Error", async () => {
      await resetAllScenarios();

      JVMEWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, JVMEWLP);
      expect(JVMEWLPJVMServer).not.undefined;
      cicsTree = await getCicsSection(view);
      await sendArrowDownKeyAndPressEnter(20);
      await JVMEWLPJVMServer?.click();

      //clear all previous notifications
      const inputBoxforcommandclear = await openCommandPaletteAndType(">Notifications: Clear All Notifications");
      await inputBoxforcommandclear.confirm();

      //Now select the disable command from the command palette
      const inputBoxforcommand2 = await openCommandPaletteAndType(">IBM CICS for Zowe Explorer: Disable JVM Server");
      await inputBoxforcommand2.confirm();

      // Notification pops up
      const inputBoxfornotification2 = await openCommandPaletteAndType(">Notifications: Focus Notification Toast");
      await inputBoxfornotification2.confirm();
      await sleep(2000);

      // Click on Kill option and check for error
      const workbenchkill2 = new Workbench();
      const notificationsCenterkill2 = await workbenchkill2.openNotificationsCenter();
      const notificationskill2 = await notificationsCenterkill2.getNotifications(NotificationType.Any);
      const notificationkill2 = notificationskill2.find(
          async n => (await n.getMessage()).includes("Choose how to purge tasks while disabling the JVM server")
      );
      if (notificationkill2) {
            const actions = await notificationkill2.getActions();
            await actions[3].click();
        }

      // Notification pops up
      const inputBoxfornotification1 = await openCommandPaletteAndType(">Notifications: Focus Notification Toast");
      await inputBoxfornotification1.confirm();
      await sleep(2000);

      //expect error notification - it'll be TABLEERROR DATAERROR because we haven't done a FORCEPURGE.
      const workbencherror = new Workbench();
      const notificationsCentererror = await workbencherror.openNotificationsCenter();
      const notificationserror = await notificationsCentererror.getNotifications(NotificationType.Error);
      const notificationerror = notificationserror.find(async (n) => (await n.getMessage()).includes("TABLEERROR"));

      expect(notificationerror).not.undefined;
      await sleep(500);
      cicsTree.takeScreenshot();  
      await resetAllScenarios();
      });

    it("Verify JVM Servers -> JVMDIWLP -> DISABLED", async () => {
      await resetAllScenarios(); 

      JVMDIWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, JVMDIWLP);
      expect(JVMDIWLPJVMServer).not.undefined;

      cicsTree = await getCicsSection(view);
      await sendArrowDownKeyAndPressEnter(10);

      await JVMDIWLPJVMServer?.click();
      expect(await JVMDIWLPJVMServer?.getLabel()).contains("JVMDIWLP (Disabled)");
      cicsTree.takeScreenshot();
      await resetAllScenarios();
    });

    it("Enable JVM Server", async () => {
        await resetAllScenarios();

        JVMDIWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, JVMDIWLP);
        expect(JVMDIWLPJVMServer).not.undefined;

        cicsTree = await getCicsSection(view);
        await sendArrowDownKeyAndPressEnter(10);

        await JVMDIWLPJVMServer?.click();
    
        //Now select the enable command from the command palette
        const inputBoxforcommand = await openCommandPaletteAndType(">IBM CICS for Zowe Explorer: Enable JVM Server");
        await inputBoxforcommand.confirm();
    
        JVMDIWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, JVMDIWLP);
        expect(JVMDIWLPJVMServer).not.undefined;
        expect(await JVMDIWLPJVMServer?.getLabel()).contains(JVMDIWLP);
        cicsTree.takeScreenshot();
        await resetAllScenarios();
    });
  });
});