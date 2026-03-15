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

import { type TreeView, commands, l10n, window } from "vscode";
import { LibraryMeta, ProgramMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";
import { getCommandInvocationContext, InvocationSource, revealResourceInTree, type IUnifiedResourceItem } from "./revealNodeInTree";

/**
 * Interface for library information extracted from a program
 */
interface ILibraryInfo {
  library: string;
  libraryDsn: string;
}

/**
 * Extracts library information from a program resource
 */
function extractLibraryInfo(programResource: IUnifiedResourceItem<any>): ILibraryInfo | null {
  const { library, librarydsn } = programResource.resource;
  
  if (!library || !librarydsn) {
    return null;
  }
  
  return { library, libraryDsn: librarydsn };
}

/**
 * Handles showing library from Resource Inspector invocation
 */
async function handleResourceInspectorInvocation(
  tree: CICSTree,
  treeview: TreeView<any>,
  programResource: IUnifiedResourceItem<any>
): Promise<void> {
  const libraryInfo = extractLibraryInfo(programResource);
  
  if (!libraryInfo) {
    window.showErrorMessage(l10n.t("No library information found for this program"));
    return;
  }

  const { library } = libraryInfo;
  const context = programResource.context;

  try {
    await revealResourceInTree({
      tree,
      treeview,
      context,
      resourceMeta: LibraryMeta,
      resourceName: library,
      selectAndFocus: true,
      customSuccessMessage: l10n.t("Library '{0}' revealed in the tree", library),
    });
  } catch (error) {
    window.showErrorMessage(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handles showing libraries from tree node invocation
 */
async function handleTreeNodeInvocation(
  tree: CICSTree,
  treeview: TreeView<any>,
  resources: IUnifiedResourceItem<any>[]
): Promise<void> {
  // Extract unique library names from all selected programs
  const libraryNames = [...new Set(
    resources
      .map((item) => extractLibraryInfo(item)?.library)
      .filter((name): name is string => !!name)
  )];

  if (libraryNames.length === 0) {
    await window.showInformationMessage(l10n.t("No libraries found in selected CICS programs"));
    return;
  }

  // Use context from the first resource
  const context = resources[0].context;

  try {
    await revealResourceInTree({
      tree,
      treeview,
      context,
      resourceMeta: LibraryMeta,
      resourceNames: libraryNames,
      selectAndFocus: libraryNames.length === 1,
    });
  } catch (error) {
    window.showErrorMessage(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Registers the show library command
 */
export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {
    // Check if Library resources are visible in settings
    const hiddenMsg = l10n.t("CICS Library resources are not visible. Enable them from your VS Code settings.");
    const libraryLabel = l10n.t("Library");
    
    if (!openSettingsForHiddenResourceType(hiddenMsg, libraryLabel)) {
      return;
    }

    // Determine invocation context (tree node vs Resource Inspector)
    const context = getCommandInvocationContext(treeview, ProgramMeta, node, tree);

    if (!context.resources || context.resources.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Program selected"));
      return;
    }

    // Handle based on invocation source
    if (context.source === InvocationSource.ResourceInspector) {
      await handleResourceInspectorInvocation(tree, treeview, context.resources[0]);
    } else {
      await handleTreeNodeInvocation(tree, treeview, context.resources);
    }
  });
}
