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
  editQuickpick.show();
  
  const editChoice = await Gui.resolveQuickPick(editQuickpick);
  const editInput = editQuickpick.value;
  editQuickpick.hide();
  
  // If user pressed Enter without selecting an item, use the edited input
  if (!editChoice && editInput) {
    return editInput;
  }
  
  if (!editChoice) {
    // User cancelled without any input
    window.showInformationMessage(l10n.t("No Selection Made"));
    return undefined;
  }
  
  // If user modified the input or selected first option, use the input value
  if (editInput !== choiceLabel || editChoice.label === choiceLabel) {
    return editInput;
  }
  
  // User selected "Edit filter" - show input box
  return Gui.showInputBox({
    prompt: l10n.t("Edit filter"),
    value: choiceLabel
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

export async function getPatternFromFilter(resourceName: string, resourceHistory: string[], filterCaseSensitive: boolean = false) {
  const quickpick = buildQuickPick(resourceName, resourceHistory);
  quickpick.show();
  const choice = await Gui.resolveQuickPick(quickpick);
  const userInput = quickpick.value;
  quickpick.hide();

  let pattern: string | undefined;
  
  // Handle case where no choice was selected
  if (!choice) {
    if (userInput) {
      pattern = userInput;
    } else {
      return undefined;
    }
  } else {
    // A history item was selected
    // If user typed text that matches the selected item exactly, apply immediately
    if (userInput && inputMatchesChoice(userInput, choice.label, filterCaseSensitive)) {
      pattern = userInput;
    } else {
      // User either clicked directly or typed to filter then clicked a different item
      // Show edit quickpick to allow confirmation or editing
      pattern = await showEditQuickpick(choice.label);
    }
  }

  if (!pattern) {
    window.showInformationMessage(l10n.t("You must enter a pattern"));
    return undefined;
  }

  return normalizePattern(pattern, filterCaseSensitive);
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
