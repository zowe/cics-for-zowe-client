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

import { ActivityBar, ExtensionsViewItem, ExtensionsViewSection, VSBrowser, WebDriver, InputBox, QuickPickItem } from "vscode-extension-tester";
import { expect } from "chai";
import { By } from "selenium-webdriver";

// sample test code on how to look for an extension
describe("CICS view tests", () => {
  let cicsForZoweExtension: ExtensionsViewSection;
  let browser: VSBrowser;
  let driver: WebDriver;
  let quickPick: InputBox;

  before(async function () {
    //this.timeout(15000);
    browser = VSBrowser.instance;
    driver = browser.driver;

    // open the extensions view
    const view = await (await new ActivityBar().getViewControl("Zowe Explorer"))?.openView();
    const sections = await view.getContent().getSections();
    await view?.getDriver().wait(async function () {
      return sections.length > 0;
    });

    // we want to find the hello-world extension (this project)
    // first we need a view section, best place to get started is the 'Installed' section
    cicsForZoweExtension = sections[3] as ExtensionsViewSection;
  });

  it("Title Check", async () => {
    // title part usually only contains the title of the view
    // but it can also have action buttons
    const title = await cicsForZoweExtension.getTitle();
    expect(title).equals("cics");
  });

  it("Create a plus button clickable test", async () => {
    // title part usually only contains the title of the view
    // but it can also have action buttons
    const plusIcon = await cicsForZoweExtension.getAction(`Create a CICS Profile`);
    await expect(plusIcon).exist;
    plusIcon.click();

    const qp = await browser.driver.wait(async function () {
      return await browser.driver.  findElement(By.id(".quick-input-widget")).isDisplayed;
    }, 15000);

    expect(qp).true;
  });
});
