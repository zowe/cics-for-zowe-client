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

import type { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { type TreeView, commands, l10n, window } from "vscode";
import { LibraryMeta, ProgramMeta } from "../doc";
import type { CICSResourceContainerNode } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { revealChildResourcesInTree } from "./revealNodeInTree";

/**
 * Registers the show library command
 * Shows the library associated with a program in the tree
 * Extracts both library and librarydsn to properly reveal library datasets
 */
export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {
    // Check if Library resources are visible in settings
    const hiddenMsg = l10n.t("CICS Library resources are not visible. Enable them from your VS Code settings.");
    const libraryLabel = l10n.t("Library");
    
    if (!openSettingsForHiddenResourceType(hiddenMsg, libraryLabel)) {
      return;
    }

    // Extract data from selected nodes
    const nodes = findSelectedNodes(treeview, ProgramMeta, node) as CICSResourceContainerNode<IProgram>[];

    if (!nodes || nodes.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Program selected"));
      return;
    }

    // Extract profile, cicsplex, regionname from first node
    const firstNode = nodes[0];
    const profileName = firstNode.getProfile().name;
    const cicsplexName = firstNode.cicsplexName;
    const regionName = firstNode.regionName;

    // Extract unique library names from all selected programs
    const libraryNames = [...new Set(
      nodes
        .map((n) => n.getContainedResource().resource.attributes.library)
    )];

    if (libraryNames.length === 0) {
      window.showInformationMessage(l10n.t("No libraries found in selected CICS programs"));
      return;
    }

    // Build a map of library names to their library dataset names
    const childCriteriaMap = new Map<string, string[]>();
    for (const libraryName of libraryNames) {
      const libraryDatasetNames = [...new Set(
        nodes
          .filter((n) => n.getContainedResource().resource.attributes.library === libraryName)
          .map((n) => n.getContainedResource().resource.attributes.librarydsn)
          .filter((dsn) => dsn && dsn.trim() !== "")
      )];
      if (libraryDatasetNames.length > 0) {
        childCriteriaMap.set(libraryName, libraryDatasetNames);
      }
    }

    try {
      // Reveal libraries and their library dataset children
      await revealChildResourcesInTree(
        tree,
        treeview,
        profileName,
        cicsplexName,
        regionName!,
        LibraryMeta,
        libraryNames,
        childCriteriaMap
      );
    } catch (error) {
      window.showErrorMessage(error instanceof Error ? error.message : String(error));
    }
  });
}
