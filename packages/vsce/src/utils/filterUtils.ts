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
import { type QuickPickItem, l10n } from "vscode";

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

export const buildQuickPick = (resName: string, history: string[], profileRegionName?: string) => {
  const quickpick = Gui.createQuickPick();
  quickpick.items = history.map((loadedFilter) => {
    // Add description to any item that matches the profile region name
    if (profileRegionName && loadedFilter === profileRegionName) {
      return {
        label: loadedFilter,
        description: l10n.t("Zowe CICS profile"),
      };
    }
    return { label: loadedFilter };
  });
  quickpick.placeholder = l10n.t("Select a filter or type to create a new one (use commas to separate multiple values)");
  quickpick.ignoreFocusOut = true;
  return quickpick;
};

/**
 * Shows an edit quickpick dialog for a selected filter choice.
 * Allows the user to either use the filter as-is or edit it before applying.
 *
 * @internal This is an internal helper function for getPatternFromFilter
 * @param choiceLabel - The label of the selected filter choice
 * @returns The pattern to use, or undefined if cancelled
 */
export async function showEditQuickpick(choiceLabel: string): Promise<string | undefined> {
  const editQuickpick = Gui.createQuickPick();
  editQuickpick.items = [
    { label: choiceLabel, description: l10n.t("Press Enter to use this filter") },
    { label: l10n.t("Edit filter"), description: l10n.t("Modify the filter before applying") }
  ];
  editQuickpick.placeholder = l10n.t("Press Enter to use '{0}' or select 'Edit filter'", choiceLabel);
  editQuickpick.value = choiceLabel;
  editQuickpick.ignoreFocusOut = true;
  
  return new Promise<string | undefined>((resolve) => {
    let wasAccepted = false;
    
    editQuickpick.onDidAccept(() => {
      wasAccepted = true;
      const selectedItem = editQuickpick.selectedItems[0];
  const editInput = editQuickpick.value;
      
  editQuickpick.hide();
  
      if (selectedItem) {
        // User selected an item from the list
        if (selectedItem.label === choiceLabel) {
          // Selected first option - use the input value (may have been edited)
          resolve(editInput);
        } else {
          // Selected "Edit filter" - show input box
          Gui.showInputBox({
            prompt: l10n.t("Edit filter"),
            value: choiceLabel
          }).then(resolve);
  }
      } else {
        // User pressed Enter without selecting an item - use the edited input (or undefined if empty)
        resolve(editInput || undefined);
      }
    });
    
    editQuickpick.onDidHide(() => {
      if (!wasAccepted) {
        // User pressed Escape or dismissed without accepting
        resolve(undefined);
      }
    });
    
    editQuickpick.show();
  });
}

/**
 * Normalizes and formats a pattern string.
 * Converts to uppercase if case-insensitive and removes whitespace.
 *
 * @internal This is an internal helper function for getPatternFromFilter
 * @param pattern - The pattern to normalize
 * @param caseSensitive - Whether the pattern should be case-sensitive
 * @returns The normalized pattern
 */
export function normalizePattern(pattern: string, caseSensitive: boolean): string {
  let normalized = pattern;
  if (!caseSensitive) {
    normalized = normalized.toUpperCase();
  }
  return normalized.replace(/\s/g, "");
}

/**
 * Checks if user input matches the selected choice (case-insensitive comparison).
 *
 * @internal This is an internal helper function for getPatternFromFilter
 * @param userInput - The text typed by the user
 * @param choiceLabel - The label of the selected choice
 * @param caseSensitive - Whether to perform case-sensitive comparison
 * @returns True if the input matches the choice
 */
export function inputMatchesChoice(userInput: string, choiceLabel: string, caseSensitive: boolean): boolean {
  const normalizedInput = caseSensitive ? userInput : userInput.toUpperCase();
  const normalizedChoice = caseSensitive ? choiceLabel : choiceLabel.toUpperCase();
  return normalizedInput === normalizedChoice;
}

export async function getPatternFromFilter(
  resourceName: string,
  resourceHistory: string[],
  filterCaseSensitive: boolean = false,
  profileRegionName?: string
) {
  const quickpick = buildQuickPick(resourceName, resourceHistory, profileRegionName);

  return new Promise<string | undefined>((resolve) => {
    let wasAccepted = false;

    // Track when user accepts (Enter key or item selection)
    quickpick.onDidAccept(() => {
      wasAccepted = true;
      const selectedItem = quickpick.selectedItems[0];
      const userInput = quickpick.value;

      quickpick.hide();

      // If an item was selected from the list
      if (selectedItem) {
        // If user typed text that matches the selected item exactly, apply immediately
        if (userInput && inputMatchesChoice(userInput, selectedItem.label, filterCaseSensitive)) {
          const normalized = normalizePattern(userInput, filterCaseSensitive);
          resolve(normalized);
        } else {
          // User either clicked directly or typed to filter then clicked a different item
          // Show edit quickpick to allow confirmation or editing
          showEditQuickpick(selectedItem.label).then((pattern) => {
            resolve(pattern ? normalizePattern(pattern, filterCaseSensitive) : undefined);
          });
        }
      } else {
        // User typed something new and pressed Enter (no item selected), or pressed Enter with no input
        resolve(userInput ? normalizePattern(userInput, filterCaseSensitive) : undefined);
      }
    });

    // Track when user dismisses (Escape key or clicking outside)
    quickpick.onDidHide(() => {
      if (!wasAccepted) {
        // User pressed Escape or dismissed without accepting
        resolve(undefined);
      }
    });

    quickpick.show();
  });
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
