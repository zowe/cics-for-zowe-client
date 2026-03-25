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
import { type QuickPickItem, l10n, window } from "vscode";

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
  const items = history.map((loadedFilter) => {
    return { label: loadedFilter };
  });

  const quickpick = Gui.createQuickPick();
  quickpick.items = items;
  quickpick.placeholder = l10n.t("Select a filter or type to create a new one (use commas to separate multiple values)");
  quickpick.ignoreFocusOut = true;

  return quickpick;
};

export async function getPatternFromFilter(resourceName: string, resourceHistory: string[], filterCaseSensitive: boolean = false) {
  const quickpick = buildQuickPick(resourceName, resourceHistory);
  quickpick.show();
  const choice = await Gui.resolveQuickPick(quickpick);
  const userInput = quickpick.value;
  quickpick.hide();

  let pattern: string;
  if (!choice && userInput) {
    pattern = userInput;
  } else if (!choice) {
    return;
  } else {
    // A history item was selected
    // Check if user typed the value or clicked a different item from the list
    const normalizedInput = filterCaseSensitive ? userInput : userInput.toUpperCase();
    const normalizedChoice = filterCaseSensitive ? choice.label : choice.label.toUpperCase();
    
    if (userInput && normalizedInput === normalizedChoice) {
      // User typed text that matches the selected item exactly - apply immediately
      pattern = userInput;
    } else if (userInput && normalizedInput !== normalizedChoice) {
      // User typed to filter, then clicked a different item - show edit quickpick with that item
      // This handles: user types "CUS" to filter, then clicks "CUSTOMER" from filtered list
      const editQuickpick = Gui.createQuickPick();
      editQuickpick.items = [
        { label: choice.label, description: l10n.t("Press Enter to use this filter") },
        { label: l10n.t("Edit filter"), description: l10n.t("Modify the filter before applying") }
      ];
      editQuickpick.placeholder = l10n.t("Press Enter to use '{0}' or select 'Edit filter'", choice.label);
      editQuickpick.value = choice.label;
      editQuickpick.ignoreFocusOut = true;
      editQuickpick.show();
      
      const editChoice = await Gui.resolveQuickPick(editQuickpick);
      const editInput = editQuickpick.value;
      editQuickpick.hide();
      
      // If user pressed Enter without selecting an item, use the edited input
      if (!editChoice && editInput) {
        pattern = editInput;
      } else if (!editChoice) {
        // User cancelled without any input
        window.showInformationMessage(l10n.t("No Selection Made"));
        return;
      } else if (editInput !== choice.label || editChoice.label === choice.label) {
        // If user modified the input or selected first option, use the input value
        pattern = editInput;
      } else {
        // User selected "Edit filter" - show input box
        pattern = await Gui.showInputBox({
          prompt: l10n.t("Edit filter"),
          value: choice.label
        });
      }
    } else {
      // No text in input - user clicked a history item directly - show edit quickpick
      const editQuickpick = Gui.createQuickPick();
      editQuickpick.items = [
        { label: choice.label, description: l10n.t("Press Enter to use this filter") },
        { label: l10n.t("Edit filter"), description: l10n.t("Modify the filter before applying") }
      ];
      editQuickpick.placeholder = l10n.t("Press Enter to use '{0}' or select 'Edit filter'", choice.label);
      editQuickpick.value = choice.label;
      editQuickpick.ignoreFocusOut = true;
      editQuickpick.show();
      
      const editChoice = await Gui.resolveQuickPick(editQuickpick);
      const editInput = editQuickpick.value;
      editQuickpick.hide();
      
      // If user pressed Enter without selecting an item, use the edited input
      if (!editChoice && editInput) {
        pattern = editInput;
      } else if (!editChoice) {
        // User cancelled without any input
        window.showInformationMessage(l10n.t("No Selection Made"));
        return;
      } else if (editInput !== choice.label || editChoice.label === choice.label) {
        // If user modified the input or selected first option, use the input value
        pattern = editInput;
      } else {
        // User selected "Edit filter" - show input box
        pattern = await Gui.showInputBox({
          prompt: l10n.t("Edit filter"),
          value: choice.label
        });
      }
    }
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
