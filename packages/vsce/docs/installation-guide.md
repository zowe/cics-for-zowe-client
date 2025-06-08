# IBM CICS for Zowe Explorer Extension Installation

## Requirements

- VS Code
- Zowe Explorer (optional - the Zowe Explorer will be added as part of the install if it isn't already present in VS Code.

## Installation

### From the VS Code Marketplace

1. Open the Extensions tab in the VS Code activity bar.
2. Search for `IBM CICS for Zowe Explorer`.
3. Click `Install`. (This will also install `Zowe Explorer` if not already present.).

You will now have the Zowe icon in the activity bar with a `CICS` section inside, alongside `Data Sets`, `Unit System Services (USS)` and `Jobs`.

### From VSIX File

1. Open the Extensions tab in the activity bar.
2. Click the `...` menu, and press **Install from VSIX...**.
3. Select the downloaded `Zowe.cics-extension-for-zowe-3.x.x.vsix` file.

<p align="center">
<img src="./images/installing_vsix.gif" alt="Installing IBM CICS for Zowe Explorer" width="700px"/> 
</p>

The successfull install message should be shown in the bottom right

<p align="center">
<img src="./images/info-message-install-completed.png" alt="IBM CICS for Zowe Explorer install completed" width="550px"/> 
</p>

The Zowe Explorer pane will still show tree views for `Data Sets`, `Unit System Services (USS)` and `Jobs`, but in addition a new view `CICS` will be included.

<p align="center">
<img src="./images/cics-tree-in-zowe-pane.png" alt="CICS tree in Zowe pane" width="300px"/> 
</p>
