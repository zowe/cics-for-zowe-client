import { ButtonAppearance } from "@vscode/webview-ui-toolkit";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface ButtonProperty {
  name: string;
  type?: ButtonAppearance | "primary";
  onclick?: any;
}

export default function Button(prop: ButtonProperty) {
  
  return (
    <VSCodeButton appearance={prop.type} onclick={prop.onclick}>
      {prop.name}
    </VSCodeButton>
  );
}
