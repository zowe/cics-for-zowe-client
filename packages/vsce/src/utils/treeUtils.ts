import { IResource } from "../doc";
import { CICSResourceContainerNode, CICSTree } from "../trees";

export function evaluateTreeNodes<T extends IResource>(node: CICSResourceContainerNode<T>, tree: CICSTree) {
  const parentNode = node.getParent() as CICSResourceContainerNode<T>;
  let numToFetch = parentNode.children.length;
  if (!parentNode.getChildResource().resources.getFetchedAll()) {
    numToFetch -= 1;
  }
  parentNode.getChildResource().resources.setNumberToFetch(numToFetch);
  tree._onDidChangeTreeData.fire(parentNode);
}
