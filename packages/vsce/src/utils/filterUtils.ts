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

import { InputBoxOptions, QuickPick, QuickPickItem, window } from "vscode";

export async function resolveQuickPickHelper(quickpick: QuickPick<QuickPickItem>): Promise<QuickPickItem | undefined> {
  return new Promise<QuickPickItem | undefined>((c) => quickpick.onDidAccept(() => c(quickpick.activeItems[0])));
}

export class FilterDescriptor implements QuickPickItem {
  constructor(private text: string) {}
  get label(): string {
    return this.text;
  }
  get description(): string {
    return "";
  }
  get alwaysShow(): boolean {
    return true;
  }
}

export async function getPatternFromFilter(resourceName: string, resourceHistory: string[]) {
  let pattern: string = "";
  const createPick = new FilterDescriptor(`\uFF0B Create New ${resourceName} Filter (use a comma to separate multiple patterns e.g. LG*,I*)`);
  const items = resourceHistory.map((loadedFilter) => {
    return { label: loadedFilter };
  });
  const quickpick = window.createQuickPick();
  quickpick.items = [createPick, ...items];
  quickpick.placeholder = "Select a Filter";
  quickpick.ignoreFocusOut = true;
  quickpick.show();
  const choice = await resolveQuickPickHelper(quickpick);
  quickpick.hide();
  if (!choice) {
    window.showInformationMessage("No Selection Made");
    return;
  }
  if (choice instanceof FilterDescriptor) {
    if (quickpick.value) {
      pattern = quickpick.value;
    }
  } else {
    pattern = choice.label;
  }
  const options2: InputBoxOptions = {
    prompt: "",
    value: pattern,
  };
  if (!options2.validateInput) {
    options2.validateInput = (_value) => null;
  }
  pattern = (await window.showInputBox(options2)) || "";
  if (!pattern) {
    window.showInformationMessage("You must enter a pattern");
    return;
  }
  // Replace with upper case
  pattern = pattern.toUpperCase();
  // Remove whitespace
  return pattern.replace(/\s/g, "");
}

export function toEscapedCriteriaString(activeFilter: string, attribute: string): string {
  // returns a string as an escaped_criteria_string suitable for the criteria
  // query parameter for a CMCI request.
  let criteria;
  const splitActiveFilter = activeFilter.split(",");
  criteria = "(";
  for (const index in splitActiveFilter) {
    criteria += `${attribute}=${splitActiveFilter[parseInt(index)]}`;
    if (parseInt(index) !== splitActiveFilter.length - 1) {
      criteria += " OR ";
    }
  }
  criteria += ")";
  return criteria;
}
