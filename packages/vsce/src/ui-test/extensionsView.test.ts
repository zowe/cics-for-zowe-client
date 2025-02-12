/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  ActivityBar,
  ExtensionsViewItem,
  ExtensionsViewSection,
  VSBrowser,
  WebDriver,
  InputBox,
  QuickPickItem,
  DefaultTreeSection,
} from "vscode-extension-tester";
import { expect } from "chai";
import { By } from "selenium-webdriver";

// sample test code on how to look for an extension
describe("CICS view tests", () => {
  let cicsTree: DefaultTreeSection;
  let browser: VSBrowser;
  let driver: WebDriver;
  let quickPick: InputBox;

  before(async function () {
    //this.timeout(15000);
    browser = VSBrowser.instance;
    driver = browser.driver;

    // open the extensions view
    const view = await (await new ActivityBar().getViewControl("Zowe Explorer"))?.openView();
    cicsTree = await view.getContent().getSection("cics");
    console.log(cicsTree);
  });

  it("Title Check", async () => {
    // title part usually only contains the title of the view
    // but it can also have action buttons
    const title = await cicsTree.getTitle();
    expect(title).equals("cics");
  });

  it("Create a plus button clickable test", async () => {
    // title part usually only contains the title of the view
    // but it can also have action buttons
    await cicsTree.expand();
    const plusIcon = await cicsTree.getAction(`Create a CICS Profile`);
    plusIcon.takeScreenshot();
    expect(plusIcon).exist;
    await plusIcon.click();

    const qp = await browser.driver.wait(async function () {
      return browser.driver.findElement(By.id(".quick-input-widget")).isDisplayed;
    }, 15000);

    expect(qp).true;
  });
});
