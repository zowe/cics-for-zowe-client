import { VSCodePanelView } from "@vscode/webview-ui-toolkit/react";

interface ViewProperty {
  id: string;
  children: React.ReactNode;
}

export default function PanelView(prop: ViewProperty) {
  return (
    <VSCodePanelView id={prop.id} className="set-margin">
      {prop.children}
    </VSCodePanelView>
  );
}
