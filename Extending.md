# Extending Zowe Explorer for IBM CICS Transaction Server

A set of APIs is exposed from the Zowe Explorer for IBM CICS TS VS Code extension to allow extenders to interact with, and add functionality to, the set of supported CICS resources.

## Context Menu Contribution

A straight forward way for extenders to contribute actions to CICS Resources would be to add context menu items to the resources in the CICS tree inside Zowe Explorer.

VS Code uses the [contributes section of the package.json](https://code.visualstudio.com/api/references/contribution-points#contributes.menus) to specify when actions should be visible on a tree item.

Inside `contributes.menus.view/item/context`, a block can be added to add your existing command to a CICS tree item using the `viewItem =~` pattern.

### Example Context Menu

1. Below is an example that adds a command to CICS Program tree items.

```json
"contributes": {
  "commands": [
    {
      "command": "my-extension-id.extensionDoesThingsToACICSProgram",
      "title": "Make Changes to my CICS Program",
      "category": "My Custom Extension"
    },
  ],
  "menus": {
    "view/item/context": [
      {
        "when": "view == cics-view && viewItem =~ /^CICSResourceNode.CICSProgram.*/ && !listMultiSelection",
        "command": "my-extension-id.extensionDoesThingsToACICSProgram",
        "group": "Extenders"
      },
    ]
  }
}
```

2. This is an example that adds a command to CICS Local File tree items representing ENABLED Local Files.

```json
"contributes": {
  "commands": [
    {
      "command": "my-extension-id.actionOnEnabledLocalFile",
      "title": "Perform action on Enabled Local File",
      "category": "My Custom Extension"
    },
  ],
  "menus": {
    "view/item/context": [
      {
        "when": "view == cics-view && viewItem =~ /^CICSResourceNode.CICSLocalFile.ENABLED.*/",
        "command": "my-extension-id.actionOnEnabledLocalFile",
        "group": "Extenders"
      }
    ]
  }
}
```

## Obtaining the Extender API

An independent NPM package is available containing all the interfaces relevant to an extender, alongside a helper method to conveniently import them.

To install the API package, run

```sh
npm install @zowe/cics-for-zowe-explorer-api
```

Then to use the APIs, import the utilities and run the getter.

```typescript
import { getCICSForZoweExplorerAPI, IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";

export async function activate(ctx) {
  ...
  const cicsAPI: IExtensionAPI | undefined = await getCICSForZoweExplorerAPI("3.13.0");
  ...
}
```

The `getCICSForZoweExplorerAPI` method takes an optional minimum version parameter that you can provide if a certain level of the Zowe Explorer for IBM CICS TS extension is required for your extension.

If the specified version requirement is met, and the APIs exist, an object implementing the `IExtensionAPI` interface is returned.

## Available Actions

### Extending a Resource

A Resource Extender class is available in the API to register actions that will be available on the specified resource type.

Here, we'll create an action using the `ResourceAction` class, and register it using the API's `resources.resourceExtender.registerAction` method.

```typescript
import { getCICSForZoweExplorerAPI, IExtensionAPI, IResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

const cicsAPI: IExtensionAPI | undefined = await getCICSForZoweExplorerAPI("3.13.0");

const myCustomResourceAction = new ResourceAction({
  id: "MY.UNIQUE.ACTION.ID",
  name: "Name to appear in action menus",
  resourceType: ResourceTypes.CICSLocalFile,
  action: "command.available.to.vscode",
});

cicsAPI.resources.resourceExtender.registerAction(myCustomResourceAction);
```

Mandatory fields that must be supplied when creating an action are:

- `id`: A unique ID for this action, used for registering and removing it.
- `name`: The human-readible name for the action that appears in any action menus.
- `resourceType`: Specifies which CICS resources it should be available to run against.
- `action`: The action to perform. This can take either of the following forms, but the same data about the resource is provided to both:
  - String - a command ID already registered with VS Code.
  - Function - a function that is called with data passed to it about the resource.

Optional fields available to adapt the behaviour of the action:

- `visibleWhen` - A function that takes the resource and context as arguments, that determines if the action is applicable and should show.

There are two inputs to the `visibleWhen` and `action` methods.

1. The resource itself, containing attributes of the CICS resource - an example being `IProgram` for a CICS Program resource.
2. The resource context, containing information about where the resource is installed, including a CICSplex name if applicable, CICS region name, and the Zowe profile used to retrieve it.

Note: The type of the resource parameter is dictated by the `resourceType` paramter of your `ResourceAction`. This means creating an action with `resourceType: ResourceTypes.CICSLocalFile` will result in the resource passed to your `action` and `visibleWhen` methods being of type `ILocalFile`. View the examples below to see how these paramters can be used by your action.

### Examples

1. Extending a CICS Local File

```typescript
import { getCICSForZoweExplorerAPI, IExtensionAPI, IResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

export async function activate(ctx) {
  const cicsAPI: IExtensionAPI | undefined = await getCICSForZoweExplorerAPI("3.13.0");

  const myCustomResourceAction = new ResourceAction({
    id: "MY.UNIQUE.ACTION.ID",
    name: "Name to appear in action menus",
    resourceType: ResourceTypes.CICSLocalFile,
    action: "command.available.to.vscode",
  });

  cicsAPI.resources.resourceExtender.registerAction(myCustomResourceAction);
}
```

2. Run a custom function when a CICS Program is enabled

This examples utilises the `visibleWhen` field to only show the action when the CICS Program is enabled, as well as passing a custom function to `action` to log information about the resource and it's context.

```typescript
import {
  getCICSForZoweExplorerAPI,
  IExtensionAPI,
  IProgram,
  IResourceAction,
  IResourceContext,
  ResourceTypes,
} from "@zowe/cics-for-zowe-explorer-api";

export async function activate(ctx) {
  const cicsAPI: IExtensionAPI | undefined = await getCICSForZoweExplorerAPI("3.13.0");

  const myResourceLoggingAction = new ResourceAction({
    id: "CUSTOM.ENABLED.PROGRAM.FUNCTIOn",
    name: "Log resource and resource context information",

    resourceType: ResourceTypes.CICSProgram,

    visibleWhen: (resource: IProgram, context: IResourceContext) => {
      return resource.status === "ENABLED";
    },

    action: (resource: IProgram, context: IResourceContext) => {
      console.log(resource.program);
      console.log(context.cicsplexName, context.regionName);
    },
  });

  cicsAPI.resources.resourceExtender.registerAction(myResourceLoggingAction);
}
```

Note: the `resource` paramter of the `action` method is strongly typed as `IProgram` because the `resourceType` attribute is set to `ResourceTypes.CICSProgram`.

3. Run a VS Code command registered elsewhere with some additional arguments from the CICS resource.

This example shows the flexibility that comes with writing your own action functions. You have access to the resource and resource context information, but can process it or manipulate it in some way before passing it to an existing VS Code command. This use case is useful for extenders that have existing functionality that they wish to trigger from Zowe Explorer for IBM CICS TS.

```typescript
import { getCICSForZoweExplorerAPI, IExtensionAPI, ITask, ResourceAction, IResourceContext, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import * as vscode from "vscode";

export async function activate(ctx) {
  vscode.commands.registerCommand("MY.CICSTASK.COMMAND", (cicsTaskId: string, cicsTranId: string, cicsRegionName: string, val: number) => {
    console.log(`${val}: Transaction ${cicsTranId} running with task ID ${cicsTaskId} in region ${cicsRegionName}`);
  });

  const cicsAPI: IExtensionAPI | undefined = await getCICSForZoweExplorerAPI("3.13.0");

  if (cicsAPI) {
    const myResourceLoggingAction = new ResourceAction({
      id: "MY.CICSTASK.CUSTOM.ACTION",
      name: "Run my own builtin command for my tasks",
      resourceType: ResourceTypes.CICSTask,

      action: async (resource: ITask, context: IResourceContext) => {
        const val = Math.round(Math.random() * 100);
        const taskID = resource.task;
        const tranID = resource.tranid;
        const regionName = context.regionName;

        await vscode.commands.executeCommand("MY.CICSTASK.COMMAND", taskID, tranID, regionName, val);
      },
    });

    cicsAPI.resources.resourceExtender.registerAction(myResourceLoggingAction);
  }
}
```
