import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";

export default function PanelTab() {
  return (
    <VSCodePanels>
      <VSCodePanelTab id="id1">Tab 1</VSCodePanelTab>
      <VSCodePanelTab id="id2">New Tab</VSCodePanelTab>
      <VSCodePanelView id="view-1">
        Coming soon! from tab1
      </VSCodePanelView>
      <VSCodePanelView id="view-2">
        <h1>Coming soon!</h1>
      </VSCodePanelView>
    </VSCodePanels>
  );
}
