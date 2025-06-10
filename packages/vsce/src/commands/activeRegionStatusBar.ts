import { StatusBarAlignment, StatusBarItem, window } from "vscode";

let activeRegionStatusBar: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 1);

export function initializeActiveRegionStatusBar(command: string, activeRegion: string): void {
  activeRegionStatusBar.command = command;
  activeRegionStatusBar.tooltip = "Select Active Region";
  updateStatusBarItem(activeRegion);
}

export function updateStatusBarItem(activeRegion: string): void {
  activeRegionStatusBar.hide();
  if (activeRegion.length <= 0) {
    activeRegionStatusBar.text = "Active Region";
    activeRegionStatusBar.show();
  } else {
    activeRegionStatusBar.text = `Active Region: ${activeRegion}`;
    activeRegionStatusBar.show();
  }
}
