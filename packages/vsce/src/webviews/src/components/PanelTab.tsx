import { VSCodePanelTab } from "@vscode/webview-ui-toolkit/react";

interface TabProperty {
  id: string;
  children: React.ReactNode;
}

export default function PanelTab(prop: TabProperty) {
  return <VSCodePanelTab id={prop.id}>{prop.children}</VSCodePanelTab>;
}
