import { ButtonAppearance } from "@vscode/webview-ui-toolkit";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface ButtonProperty {
  name: string;
  type?: ButtonAppearance | "primary";
  onclick?: any;
  styles?: string | undefined;
}

export default function Button(prop: ButtonProperty) {
  return (
    <VSCodeButton appearance={prop.type} onclick={prop.onclick} className={prop.styles}>
      {prop.name}
    </VSCodeButton>
  );
}
