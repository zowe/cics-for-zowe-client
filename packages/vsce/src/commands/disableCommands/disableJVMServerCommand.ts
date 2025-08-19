import { CicsCmciConstants, CICSSession, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { ProgressLocation, TreeView, commands, window } from "vscode";
import constants from "../../constants/CICS.defaults";
import { JVMServerMeta } from "../../doc";
import { ICommandParams } from "../../doc/commands/ICommandParams";
import { CICSTree } from "../../trees/CICSTree";
import { CICSLogger } from "../../utils/CICSLogger";
import { findSelectedNodes } from "../../utils/commandUtils";
import { runPutResource, pollForCompleteAction } from "../../utils/resourceUtils";
import { evaluateTreeNodes } from "../../utils/treeUtils";

/**
 * Performs disable on selected CICSJVMServer nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getDisableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.disableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM Server selected");
      return;
    }

    const disableType = await window.showInformationMessage(
      `Choose one of the following for Disabling`,
      ...["Phase Out", "Purge", "Force Purge", "Kill"]
    );
    if (!disableType) {
      return;
    }

    await window.withProgress(
      {
        title: "Disable",
        location: ProgressLocation.Notification,
        cancellable: false,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        for (const node of nodes) {
          progress.report({
            message: `Disabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await disableJVMServer(node.getSession(), {
              name: node.getContainedResourceName(),
              cicsPlex: node.cicsplexName,
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
            });

            await pollForCompleteAction(
              node,
              (response) => {
                return response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "DISABLED";
              },
              () => evaluateTreeNodes(node, tree)
            );
          } catch (error) {
            const message = `Something went wrong while disabling JVMServer ${node.getContainedResourceName()}\n\n${JSON.stringify(
              error.message
            ).replace(/(\\n\t|\\n|\\t)/gm, " ")}`;
            window.showErrorMessage(message);
            CICSLogger.error(message);
          }
        }
      }
    );
  });
}

function disableJVMServer(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      session: session,
      resourceName: CicsCmciConstants.CICS_JVMSERVER_RESOURCE,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `NAME='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "DISABLE",
          },
        },
      },
    }
  );
}
