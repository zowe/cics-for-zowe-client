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

import { Gui } from "@zowe/zowe-explorer-api";
import { QuickPickItem, l10n, window } from "vscode";

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

export const buildQuickPick = (resName: string, history: string[]) => {
  const createPick = new FilterDescriptor(
    l10n.t("{0} Create New {1} Filter (use a comma to separate multiple patterns e.g. LG*,I*)", "\uFF0B", resName)
  );
  const items = history.map((loadedFilter) => {
    return { label: loadedFilter };
  });

  const quickpick = Gui.createQuickPick();
  quickpick.items = [createPick, ...items];
  quickpick.placeholder = l10n.t("Select a Filter");
  quickpick.ignoreFocusOut = true;

  return quickpick;
};

export async function getPatternFromFilter(resourceName: string, resourceHistory: string[], filterCaseSensitive: boolean = false) {
  const quickpick = buildQuickPick(resourceName, resourceHistory);
  quickpick.show();
  const choice = await Gui.resolveQuickPick(quickpick);
  quickpick.hide();

  if (!choice) {
    window.showInformationMessage(l10n.t("No Selection Made"));
    return;
  }

  let pattern: string = "";
  if (choice instanceof FilterDescriptor && quickpick.value) {
    pattern = quickpick.value;
  } else if (choice instanceof FilterDescriptor) {
    pattern = await Gui.showInputBox({ prompt: "", value: pattern });
  } else {
    pattern = choice.label;
  }

  if (!pattern) {
    window.showInformationMessage(l10n.t("You must enter a pattern"));
    return;
  }

  if (!filterCaseSensitive) {
    pattern = pattern.toUpperCase();
  }

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
