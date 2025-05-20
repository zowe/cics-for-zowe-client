import { commands, TreeView } from "vscode";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes } from "../utils/commandUtils";
import { CICSPlexTree } from "../trees/CICSPlexTree";
import { CICSRegionsContainer } from "../trees/CICSRegionsContainer";
import { CICSRegionTree } from "../trees/CICSRegionTree";
import { CICSProgramTreeItem } from "../trees/treeItems/CICSProgramTreeItem";
import { CICSLibraryTree } from "../trees/CICSLibraryTree";
import { CICSCombinedProgramTree } from "../trees/CICSCombinedTrees/CICSCombinedProgramTree";

export function showLibraryDataSetCommand(tree: CICSTree, treeview: TreeView<any>){
    return commands.registerCommand("cics-extension-for-zowe.showLibraryDataSet", async (node) => {
    const allSelectedNodes = findSelectedNodes(treeview, CICSProgramTreeItem, node) as CICSProgramTreeItem[];
    if (!allSelectedNodes || !allSelectedNodes.length) {
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
    const libraryDSN = [];
    if (allSelectedNodes[0] instanceof CICSProgramTreeItem) {
        for(const localProgramTreeItem of allSelectedNodes){
          const program = localProgramTreeItem.program;
          if (typeof program["library"] === "string" && program["library"].trim() !== "") {
            library.push(program["library"]);
          }
          if (typeof program["librarydsn"] === "string" && program["librarydsn"].trim() !== "") {
            libraryDSN.push(program["librarydsn"]);
          }
        } 
    } 
    const libraryPattern = library.join(", ");
    const libraryTree = resourceFolders.filter((child) => child instanceof CICSLibraryTree)[0] as CICSLibraryTree;
    const libraryDSNPattern = libraryDSN.join(", ");
    if(library.length > 0){
      libraryTree.setFilter(libraryPattern);
      await libraryTree.loadContents();
    }
    if(libraryDSN.length > 0){
      libraryTree.children[0].setFilter(libraryDSNPattern);
      await libraryTree.children[0].loadContentsWithDSFilter()
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