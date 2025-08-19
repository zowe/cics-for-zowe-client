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
 * Performs enable on selected JVM Server nodes.
 * @param tree - tree which contains the node
 * @param treeview - Tree View of current cics tree
 */
export function getEnableJVMServerCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.enableJVMServer", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, JVMServerMeta, clickedNode);
    if (!nodes || !nodes.length) {
      await window.showErrorMessage("No CICS JVM Server selected");
      return;
    }

    await window.withProgress(
      {
        title: "Enable",
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => { });

        for (const node of nodes) {
          progress.report({
            message: `Enabling ${nodes.indexOf(node) + 1} of ${nodes.length}`,
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          try {
            await enableJVMServer(node.getSession(), {
              name: node.getContainedResourceName(),
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
            });

            await pollForCompleteAction(
              node,
              (response) => {
                return response.records?.cicsjvmserver?.enablestatus.toUpperCase() === "ENABLED";
              },
              () => evaluateTreeNodes(node, tree)
            );
          } catch (error) {
            const message = `Something went wrong while enabling JVM Server ${node.getContainedResourceName()}\n\n${JSON.stringify(
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

function enableJVMServer(session: CICSSession, parms: ICommandParams): Promise<ICMCIApiResponse> {
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
            name: "ENABLE",
          },
        },
      },
    }
  );
}
