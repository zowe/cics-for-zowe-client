import { HTMLTemplate } from "@zowe/zowe-explorer-api";
import { randomUUID } from "crypto";
import * as vscode from "vscode";
import Mustache = require("mustache");

export class BottomViewManager {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly treeview: vscode.TreeView<any>,
    private readonly data: Array<{ label: string; program: any }>
  ) {}

  initializeWebview(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "init") {
        console.log("React app initialized");
        await this.sendDataToReactApp();
      }
    });
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  private async sendDataToReactApp() {
    if (this._view) {
      try {
        await this._view.webview.postMessage({
          command: "init",
          data: this.data, // Use data from the constructor
        });
      } catch (error) {
        console.error("Failed to send data to React app:", error);
      }
    }
  }
  //reusing the function from Zowe-explorer-api
  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "src", "webviews", "dist", "resource-inspector", "resource-inspector.js")
    );
    const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "webviews", "dist", "codicons", "codicon.css"));
    const nonce = randomUUID();

    return Mustache.render(HTMLTemplate.default, {
      uris: { resource: { script: scriptUri, codicons: codiconsUri } },
      nonce,
    });
  }
}
