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

import { commands, ExtensionContext, window } from "vscode";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { getFocusRegion } from "./setFocusRegionCommand";
import { IFocusRegion } from "./IFocusRegion";
import { Resource, ResourceContainer } from "../resources";
import { IResource, IResourceMeta } from "../doc";
import { SupportedResources } from "../model";
import { CICSLogger } from "../utils/CICSLogger";
import { CICSMessages } from "../constants/CICS.messages";

export function getInspectResourceCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectResource", async (resourceName: string, resourceType: string) => {
    const focusRegion: IFocusRegion = await getFocusRegion();

    if (focusRegion) {
      const type = getResourceType(resourceType);

      if (!type) {
        // Error if resource type not found
        CICSLogger.error(CICSMessages.CICSResourceTypeNotFound.message);
        window.showErrorMessage(CICSMessages.CICSResourceTypeNotFound.message);
        return;
      }

      const resourceContainer = new ResourceContainer<IResource>(type);
      resourceContainer.setCriteria([resourceName]);
      const resources:[Resource<IResource>[], boolean] = await resourceContainer.loadResources(
        focusRegion.session,
        focusRegion.focusSelectedRegion,
        focusRegion.cicsPlex,
      );

      const resourceViewProvider = ResourceInspectorViewProvider.getInstance(context.extensionUri);
      const enbededWebview = resourceViewProvider?._manager?._view;

      // Will only have one resource
      const resource:Resource<IResource>[] = resources[0];
      resourceViewProvider.reloadData( {
            resource: resource[0],
            meta: resourceContainer.getMeta(),
          }, enbededWebview);

      // Not sure why its vscode-extension-for-zowe
      commands.executeCommand("setContext", "zowe.vscode-extension-for-zowe.showResourceInspector", true);
      commands.executeCommand("workbench.view.extension.inspector-panel");
    }
  });

  function getResourceType(resourceName: string): IResourceMeta<IResource> {
    const types: IResourceMeta<IResource>[] = SupportedResources.metaResources.filter((value) => value.resourceName == resourceName);

    // Should only have one
    if (types && types.length > 0) {
      return types[0];
    }
    return undefined;
  }
}
