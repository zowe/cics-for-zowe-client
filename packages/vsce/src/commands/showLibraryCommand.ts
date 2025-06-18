import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { commands, TreeView, window } from "vscode";
import { ILibrary, IProgram, IResource, ProgramMeta } from "../doc";
import { CICSResourceContainerNode } from "../trees";
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
    const libraryTree = nodes[0]
      .getParent()
      .getParent()
      .children.filter(
        (child: CICSResourceContainerNode<IResource>) => child.getChildResource().meta.resourceName === CicsCmciConstants.CICS_LIBRARY_RESOURCE
      )[0] as CICSResourceContainerNode<ILibrary>;

    //setting up the library tree with the filtered libraries

    libraryTree.setFilter(Array.from(libraryDSNMap.keys()));
    const libraryNodes = await libraryTree.getChildren();
    let libNode;
    const libArray = [];
    //iterate through the library nodes and set the filter for each library node
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
        await libNode.getChildren();
        libNode.description = libDsns.join(" OR ");
        libArray.push(libNode);
      }
    }

    libraryTree.description = Array.from(libraryDSNMap.keys()).join(" OR ");
    tree._onDidChangeTreeData.fire(libraryTree);
    await treeview.reveal(libraryTree, { expand: true });
    //reveal the library datasets in the treeview
    for (const lib of libArray) {
      await treeview.reveal(lib, { expand: true });
    }
  });
}
