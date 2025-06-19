# IBM CICS for Zowe Explorer API

This is an API package that works alongside the **IBM CICS for Zowe Explorer** VS Code extension to allow extenders to import and access interfaces relevent to extending the CICS extension.

An example of using this API from another VS Code extension wanting to extend CICS resources in IBM CICS for Zowe Explorer.

- Uses the VS Code extensions API to get the CICS extension.
- Activates the extension which returns it's API.
- Creates a resource action object describing the action and it's behaviour.
- Registers the action using the resourceExtender class on the API.

```typescript
import { IExtensionAPI, IResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { Extension } from "vscode";

const extension: Extension = vscode.extensions.getExtension("Zowe.cics-extension-for-zowe");
const api: IExtensionAPI = await extension?.activate();

if (api) {
  const myAction: IResourceAction = {
    id: "MyExtension.OPENDS",
    name: "Open data set with my extension",
    resourceTypes: [ResourceTypes.CICSLocalFile],

    action: async (resource: ICICSLocalFile, input: IResourceContext): Promise<void> => {
      try {
        await vscode.window.showInformationMessage(`NOW RUNNING COMMAND TO OPEN DS ${resource.dsname}`);
      } catch (error) {
        console.log(error);
      }
    },

    visibleWhen: (resource: ICICSLocalFile, input: IResourceContext) => {
      return resource.dsname !== undefined;
    },
  };

  api.resources.resourceExtender.registerAction<ICICSLocalFile>(myAction);
}
```

## Available exports

### ResourceTypes

- Enum of CICS resources supported by IBM CICS for Zowe Explorer.

```typescript
import { ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

const localFileResource = ResourcesTypes.CICSLocalFile;
const programResource = ResourcesTypes.CICSProgram;
```

### SupportedResourceTypes

- List of strings representing the names of CICS resources supported by IBM CICS for Zowe Explorer.

```typescript
import { SupportedResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

SupportedResourceTypes.map((resourceName: string) => console.log(resourceName));
```

### IResource

- Interface used as a parent to all CICS resources; specific resources extend this interface.

```typescript
import { IResource } from "@zowe/cics-for-zowe-explorer-api";

const program: IResource = {
  eyu_cicsname: "MYREGION",
  status: "enabled",
};
```

### IResourceContext

- Interface representing context information about a CICS resource.
- Includes a the CICS session, CICS Zowe profile, CICSplex name, and region name

```typescript
import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";

const resourceContext: IResourceContext;
const cicsSessionWithAuthToken = resourceContext.session;

console.log(`My resource is in region ${resourceContext.regionName} and CICSplex ${resourceContext.cicsplexName}`);
```

### IResourceAction

- Interface that describes the shape of an action that can be registered to a CICS resource type.
- Outlines the name of the action, a unique ID, the resource type it should be applied to (`ResourceType`).
- Optional attributes for `visibleWhen` and `enabledWhen` that determine when the action should be visible and enabled.
- An `action` attribute that is the action to perform; a string containing the name of the VS Code command to run, or a typescript method taking the resource and resourceContext as paramters.

```typescript
import { IResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

const action: IResourceAction = {
  id: "my.unique.action.ID",
  name: "Run my action",
  resourceType: [ResourceTypes.CICSProgram],

  visibleWhen: (resource: IResource, resourceContext: IResourceContext) => {
    return resource.eyu_cicsname !== undefined;
  }
  enabledWhen: (resource: IResource, resourceContext: IResourceContext) => {
    return resource.status === "enabled";
  }

  action: "workbench.action.toggleLightDarkThemes"
}
```

### IExtensionAPI

- Interface representing the whole API offered by the IBM CICS for Zowe Explorer VS Code extension.
- Contains the ResourceTypes, SupportedResources, and ResourceExtender APIs.

```typescript
import { IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";
import { Extension } from "vscode";

const extension: Extension = vscode.extensions.getExtension("Zowe.cics-extension-for-zowe");
const api: IExtensionAPI = await extension?.activate();

api.resources.resourceExtender.registerAction(myAction);
```

### IResourceExtender

- Interface for the CICSResourceExtender class; used to register actions against resource types.
- CICSRequestExtender is obtained from the IBM CICS for Zowe Explorer exports - this interface allows extenders to know it's type.

```typescript
import { IResourceExtender, IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";
import { Extension } from "vscode";

const extension: Extension = vscode.extensions.getExtension("Zowe.cics-extension-for-zowe");
const api: IExtensionAPI = await extension?.activate();

const resourceExtender: IResourceExtender = api.resources.resourceExtender;

resourceExtender.registerAction(myIResourceActionObject);
```
