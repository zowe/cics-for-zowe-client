import { VSCodePanelView } from "@vscode/webview-ui-toolkit/react";

interface ViewProperty {
  id: string;
  children: React.ReactNode;
  styles?: string | undefined;
}

export default function PanelView(prop: ViewProperty) {
  return (
    <VSCodePanelView id={prop.id} className={prop.styles}>
      {prop.children}
    </VSCodePanelView>
  );
}
