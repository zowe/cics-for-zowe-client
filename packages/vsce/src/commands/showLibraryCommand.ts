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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { TreeView, commands, window } from "vscode";
import { ILibrary, ILibraryDataset, IProgram, IResource, LibraryMeta, ProgramMeta } from "../doc";
import { CICSRegionsContainer, CICSRegionTree, CICSResourceContainerNode } from "../trees";
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
  if (node.getParent().label === "Programs") {
    const parent = node.getParent().getParent();
    if (parent.getParent() instanceof CICSRegionsContainer) {
      await treeview.reveal(parent.getParent(), { expand: true });
      return parent.getParent().children as CICSRegionTree[];
    } else {
      return [parent as CICSRegionTree];
    }
  } else {
    const regionsContainer = node.getParent().getParent().children.filter(
      (child) => child instanceof CICSRegionsContainer)[0] as CICSRegionsContainer;
    await treeview.reveal(regionsContainer, { expand: true });
    return regionsContainer.children;
  }
};

export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {

    if (!openSettingsForHiddenResourceType("CICS Library resources are not visible. Enable them from your VS Code settings.", "Library")) {
      return;
    }

    const nodes = findSelectedNodes(treeview, ProgramMeta, node) as CICSResourceContainerNode<IProgram>[];
    if (!nodes || nodes.length === 0) {
      window.showErrorMessage("No CICS Program selected");
      return;
    }

    const librariesToReveal = getLibrariesToReveal(nodes);
    if (librariesToReveal.size === 0) {
      await window.showInformationMessage(`No libraries found in selected CICS programs`);
      return;
    }

    const listOfRegions: CICSRegionTree[] = await getListOfAvailableRegions(nodes[0], treeview);

    for (const [region, libraries] of librariesToReveal) {

      const regionTree: CICSRegionTree = listOfRegions.filter(
        (regTree) => regTree.getRegionName() === region)[0];

      await treeview.reveal(regionTree, { expand: true });

      const libraryTree: CICSResourceContainerNode<ILibrary> = regionTree.children.filter(
        (resourceTree: CICSResourceContainerNode<IResource>) => resourceTree.getChildResource().meta === LibraryMeta
      )[0] as CICSResourceContainerNode<ILibrary>;

      //clearing the previous filter and description
      libraryTree.clearFilter();
      libraryTree.description = "";
      libraryTree.children = [];
      libraryTree.refreshingDescription = false;
      libraryTree.getChildResource().resources.resetCriteria();
      libraryTree.getChildResource().resources.resources = [];

      await treeview.reveal(libraryTree, { expand: true });

      libraryTree.setFilter([...libraries.keys()]);
      libraryTree.description = [...libraries.keys()].join(" OR ");
      libraryTree.refreshingDescription = false;
      const libraryNodes = await libraryTree.getChildren();

      const libArray: CICSResourceContainerNode<IResource>[] = [];
      //setting the filter and description for each library node
      for (const child of libraryNodes) {

        const libNode = child as CICSResourceContainerNode<ILibraryDataset>;
        if (
          libNode.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE &&
          libraries.has(libNode.getContainedResourceName()) &&
          libraries.get(libNode.getContainedResourceName())!.size > 0
        ) {
          libNode.setFilter([...libraries.get(libNode.getContainedResourceName())]);
          libNode.description = [...libraries.get(libNode.getContainedResourceName())].join(" OR ");
          libArray.push(libNode);
          libNode.refreshingDescription = false;
        }
      }
      for (const lib of libArray) {
        await treeview.reveal(lib, { expand: true });
      }
    }
  });
}
