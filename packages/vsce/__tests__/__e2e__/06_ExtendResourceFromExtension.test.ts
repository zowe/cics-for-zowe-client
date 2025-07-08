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
import { DefaultTreeSection, NotificationType, Workbench } from "vscode-extension-tester";
import { sleep } from "./util/globalMocks";
import { openZoweExplorer, getCicsSection } from "./util/initSetup.test";

describe("Extender API Action registration", async () => {

  let view, cicsTree: DefaultTreeSection;

  before(async () => {
    await sleep(2000);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
  });

  it("Should verify extension was installed", async () => {
    const notificationCenter = await new Workbench().openNotificationsCenter();
    const notifications = await notificationCenter.getNotifications(NotificationType.Info);

    cicsTree.takeScreenshot();

    let extensionInfoMessageFound = false;
    for (const notif of notifications) {
      const notifText = await notif.getText();
      if (notifText.includes("TEST.ACTION.1")) {
        extensionInfoMessageFound = true;
        break;
      }
    }
    expect(extensionInfoMessageFound).true;
  });
});
