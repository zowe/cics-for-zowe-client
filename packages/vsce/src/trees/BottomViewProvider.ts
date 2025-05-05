import * as vscode from "vscode";
import { BottomViewManager } from "./BottomViewManager";

export class BottomViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "bottom-view";
  private _manager?: BottomViewManager;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly treeview: vscode.TreeView<any>
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    if (this._manager) {
      this._manager.initializeWebview(webviewView);
    }
  }

  reloadData(data: Array<{ label: string; program: any }>) {
    this._manager = new BottomViewManager(this.extensionUri, this.treeview, data); 
  }
}
