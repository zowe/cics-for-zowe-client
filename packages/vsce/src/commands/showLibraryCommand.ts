import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { TreeView, commands, window } from "vscode";
import { ILibrary, IProgram, IResource, ProgramMeta } from "../doc";
import { CICSRegionsContainer, CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { openSettingsForHiddenResourceType } from "../utils/workspaceUtils";

export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {
    const msg = "CICS Library resources are not visible. Enable them from your VS Code settings.";
    if (!openSettingsForHiddenResourceType(msg, "Library")) {
      return;
    }

    const nodes = findSelectedNodes(treeview, ProgramMeta, node) as CICSResourceContainerNode<IProgram>[];
    if (!nodes || !nodes.length) {
      window.showErrorMessage("No CICS Program selected");
      return;
    }

    const labels = nodes.map((n) => (typeof n.label === "string" ? n.label : (n.label?.label ?? "")));
    const selectedNodesLabels = labels.join(",");

    // Create a map: library name -> set of librarydsn (unique values)
    const libraryDSNMap = new Map<string, Set<string>>();
    for (const childNode of nodes) {
      const lib = childNode.getContainedResource().resource.attributes.library;
      const libDsn = childNode.getContainedResource().resource.attributes.librarydsn;
      if (lib) {
        if (!libraryDSNMap.has(lib)) {
          libraryDSNMap.set(lib, new Set());
        }
        if (libDsn && libDsn.length > 0) {
          libraryDSNMap.get(lib)!.add(libDsn);
        }
      }
    }

    if (!libraryDSNMap.size) {
      await window.showInformationMessage(`${selectedNodesLabels} do not contain library`);
      return;
    }
    let libraryTree: CICSResourceContainerNode<ILibrary> | undefined;
    const label = nodes[0].getParent().label;

    //if the label is "All Programs", we need to get the library tree from the regions node
    if (label === "All Programs") {
      let regionName = nodes[0].description.toString();
      //regionName comes as (REGION_NAME),so replacing extra brackets
      if (regionName.length > 0) {
        regionName = regionName.match(/\(([^)]*)\)/)?.[1]?.trim() ?? regionName;
        const regionsNode = nodes[0]
          .getParent()
          .getParent()
          .children.filter((ch) => ch.label.toString().includes("Regions"))[0] as CICSRegionsContainer;
        //reveal the regions node if not already expanded
        await treeview.reveal(regionsNode, { expand: true });
        const regionTree = regionsNode.children.filter((ch) => ch.label === regionName)[0];
        //reveal the region resources if not already expanded
        await treeview.reveal(regionTree, { expand: true });
        libraryTree = regionTree.children.filter(
          (child: CICSResourceContainerNode<IResource>) => child.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LIBRARY_RESOURCE
        )[0] as CICSResourceContainerNode<ILibrary>;
      }
    } else {
      libraryTree = nodes[0]
        .getParent()
        .getParent()
        .children.filter(
          (child: CICSResourceContainerNode<IResource>) => child.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LIBRARY_RESOURCE
        )[0] as CICSResourceContainerNode<ILibrary>;
    }
    //clearing the previous filter and description
    libraryTree.clearFilter();
    libraryTree.description = "";
    libraryTree.children = [];
    libraryTree.refreshingDescription = false;
    libraryTree.getChildResource().resources.resetCriteria();
    libraryTree.getChildResource().resources.resources = [];

    await treeview.reveal(libraryTree, { expand: true });

    //set the new filter and description
    const libraryNames = Array.from(libraryDSNMap.keys());
    libraryTree.setFilter(libraryNames);
    libraryTree.description = libraryNames.join(" OR ");
    libraryTree.refreshingDescription = false;
    const libraryNodes = await libraryTree.getChildren();
    let libNode;
    const libArray: CICSResourceContainerNode<IResource>[] = [];
    //setting the filter and description for each library node
    for (const child of libraryNodes) {
      libNode = child as CICSResourceContainerNode<IResource>;
      const labelKey = typeof libNode.label === "string" ? libNode.label : (libNode.label?.label ?? "");
      if (
        libNode.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE &&
        libraryDSNMap.has(labelKey) &&
        libraryDSNMap.get(labelKey) &&
        libraryDSNMap.get(labelKey)!.size > 0
      ) {
        const libDsns = Array.from(libraryDSNMap.get(labelKey)!);
        libNode.setFilter(libDsns);
        libNode.description = libDsns.join(" OR ");
        libArray.push(libNode);
        libNode.refreshingDescription = false;
      }
    }
    for (const lib of libArray) {
      await treeview.reveal(lib, { expand: true });
    }
  });
}
