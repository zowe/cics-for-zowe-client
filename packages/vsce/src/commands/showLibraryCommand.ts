import { commands, TreeView, window } from "vscode";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSProgramTreeItem } from "../trees/treeItems/CICSProgramTreeItem";
import { CICSLibraryTree } from "../trees/CICSLibraryTree";
import { CICSCombinedProgramTree } from "../trees/CICSCombinedTrees/CICSCombinedProgramTree";

export function showLibraryCommand(tree: CICSTree, treeview: TreeView<any>){
    return commands.registerCommand("cics-extension-for-zowe.showLibrary", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, node) as CICSProgramTreeItem[];
    if (!allSelectedNodes || !allSelectedNodes.length) {
      await window.showErrorMessage("No CICS program was selected");
      return;
    }
    let resourceFolders;
    if (allSelectedNodes[0].getParent() instanceof CICSCombinedProgramTree) {
      const cicsPlex: CICSPlexTree = allSelectedNodes[0].getParent().getParent();
      const regionsContainer = cicsPlex.getChildren().filter((child) => child instanceof CICSRegionsContainer)[0];
      //@ts-ignore
      const regionTree: CICSRegionTree = regionsContainer
        .getChildren()!
        .filter((region: CICSRegionTree) => region.getRegionName() === allSelectedNodes[0].parentRegion.getRegionName())[0];
      resourceFolders = regionTree.getChildren()!;
    } else {
      resourceFolders = allSelectedNodes[0].parentRegion.getChildren()!;
    }
    const library = [];
    const libraryDSNMap = new Map();
    if (allSelectedNodes[0] instanceof CICSProgramTreeItem) {
        for(const localProgramTreeItem of allSelectedNodes){
          const program = localProgramTreeItem.program;
          if (program.library?.trim()) {
            library.push(program.library);
          }
          if (program.librarydsn?.trim()) {
            const existingDSN = libraryDSNMap.get(program.library);
            const newDSN = existingDSN ? `${existingDSN},${program.librarydsn}` : program.librarydsn;
            libraryDSNMap.set(program.library, newDSN);
          } 
        } 
    }
    if (!library.length) {
      await window.showInformationMessage("This program does not have a library");
      return;
    } 
    const libraryPattern = library.join(", ");
    const libraryTree = resourceFolders.filter((child) => child instanceof CICSLibraryTree)[0] as CICSLibraryTree;
    if(library.length > 0){
      libraryTree.setFilter(libraryPattern);
      await libraryTree.loadContents();
    }
    for (const libChildren of libraryTree.children) {
      const filter = libraryDSNMap.get(libChildren.label);
      if (filter?.trim()) {
        libChildren.setFilter(filter);
        await libChildren.loadContentsWithDSFilter();
      }
    }

    tree._onDidChangeTreeData.fire(undefined);
    if (allSelectedNodes[0].getParent() instanceof CICSCombinedProgramTree) {
      const nodeToExpand: any = libraryTree;
      await treeview.reveal(nodeToExpand.getParent());
      tree._onDidChangeTreeData.fire(undefined);
    }
    tree._onDidChangeTreeData.fire(undefined);

});
}