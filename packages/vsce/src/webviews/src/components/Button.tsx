import { ButtonAppearance } from "@vscode/webview-ui-toolkit";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface ButtonProperty {
  name: string;
  type?: ButtonAppearance | "primary";
}

export default function Button({ name, type }: ButtonProperty) {
  return (
    <div>
      <VSCodeButton appearance={type}>{name}</VSCodeButton>
    </div>
  );
}
