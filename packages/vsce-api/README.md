# Zowe&reg; Explorer for IBM&reg; CICS&reg; Transaction Server API

This is an API package that works alongside the **Zowe Explorer for IBM CICS Transaction Server** VS Code extension to allow extenders to import and access interfaces relevent to extending the CICS extension.

## Available exports

### ResourceTypes

- Enum of CICS resources supported by Zowe Explorer for IBM CICS Transaction Server.

```typescript
import { ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";

const localFileResource = ResourcesTypes.CICSLocalFile;
const programResource = ResourcesTypes.CICSProgram;
```

### SupportedResourceTypes

- List of strings representing the names of CICS resources supported by Zowe Explorer for IBM CICS Transaction Server.

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

### IExtensionAPI

- Interface representing the whole API offered by the Zowe Explorer for IBM CICS Transaction Server VS Code extension.
- Contains the ResourceTypes, and SupportedResources APIs.

```typescript
import { IExtensionAPI } from "@zowe/cics-for-zowe-explorer-api";
import { Extension } from "vscode";

const extension: Extension = vscode.extensions.getExtension("Zowe.cics-extension-for-zowe");
const api: IExtensionAPI = await extension?.activate();
```
