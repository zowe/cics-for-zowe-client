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

import { ILibrary, IProgram, IResource } from "@zowe/cics-for-zowe-explorer-api";
import { TreeView, commands, l10n, window } from "vscode";
import { LibraryMeta, ProgramMeta } from "../doc";
import { CICSRegionTree, CICSRegionsContainer, CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";

const getLibrariesToReveal = (nodes: CICSResourceContainerNode<IProgram>[]): Map<string, Map<string, Set<string>>> => {
  const librariesToReveal: Map<string, Map<string, Set<string>>> = new Map();
  for (const childNode of nodes) {
    const region = childNode.regionName ?? childNode.getContainedResource().resource.attributes.eyu_cicsname;
    const library = childNode.getContainedResource().resource.attributes.library;
    const libraryDsn = childNode.getContainedResource().resource.attributes.librarydsn;

    if (library && libraryDsn) {
      if (!librariesToReveal.has(region)) {
        librariesToReveal.set(region, new Map());
      }
      if (!librariesToReveal.get(region)!.has(library)) {
        librariesToReveal.get(region)!.set(library, new Set<string>());
      }
      librariesToReveal.get(region)!.get(library)!.add(libraryDsn);
    }
  }

  return librariesToReveal;
};

const getListOfAvailableRegions = async (node: CICSResourceContainerNode<IProgram>, treeview: TreeView<any>): Promise<CICSRegionTree[]> => {
  const programsLabel = l10n.t("Programs");
  if (node.getParent().label === programsLabel) {
    const parent = node.getParent().getParent();
    if (parent.getParent() instanceof CICSRegionsContainer) {
      await treeview.reveal(parent.getParent(), { expand: true });
      return parent.getParent().children as CICSRegionTree[];
    } else {
      return [parent as CICSRegionTree];
    }
  } else {
    const regionsContainer = node
      .getParent()
      .getParent()
      .children.filter((child) => child instanceof CICSRegionsContainer)[0] as CICSRegionsContainer;
    await treeview.reveal(regionsContainer, { expand: true });
    return regionsContainer.children;
  }
};

export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {
    const hiddenMsg = l10n.t("CICS Library resources are not visible. Enable them from your VS Code settings.");
    const libraryLabel = l10n.t("Library");
    if (!openSettingsForHiddenResourceType(hiddenMsg, libraryLabel)) {
      return;
    }

    const nodes = findSelectedNodes(treeview, ProgramMeta, node) as CICSResourceContainerNode<IProgram>[];
    if (!nodes || nodes.length === 0) {
      window.showErrorMessage(l10n.t("No CICS Program selected"));
      return;
    }

    const librariesToReveal = getLibrariesToReveal(nodes);
    if (librariesToReveal.size === 0) {
      await window.showInformationMessage(l10n.t("No libraries found in selected CICS programs"));
      return;
    }

    const listOfRegions: CICSRegionTree[] = await getListOfAvailableRegions(nodes[0], treeview);

    for (const [region, libraries] of librariesToReveal) {
      const regionTree: CICSRegionTree = listOfRegions.filter((regTree) => regTree.getRegionName() === region)[0];

      await treeview.reveal(regionTree, { expand: true });

      const libraryTree: CICSResourceContainerNode<ILibrary> = regionTree.children.filter((resourceTree: CICSResourceContainerNode<IResource>) =>
        resourceTree.resourceTypes.includes(LibraryMeta)
      )[0] as CICSResourceContainerNode<ILibrary>;

      libraryTree.clearCriteria();
      await libraryTree.getFetcher().reset();
      libraryTree.setCriteria([...libraries.keys()]);
      await treeview.reveal(libraryTree, { expand: true });

      for (const child of libraryTree.children) {
        const crit = [...libraries.get((child as CICSResourceContainerNode<ILibrary>).getContainedResourceName())];
        (child as CICSResourceContainerNode<ILibrary>).clearCriteria();
        await (child as CICSResourceContainerNode<ILibrary>).getFetcher().reset();
        (child as CICSResourceContainerNode<ILibrary>).setCriteria(crit);
        await treeview.reveal(child, { expand: true });
      }
    }
  });
}
