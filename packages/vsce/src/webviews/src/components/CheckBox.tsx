import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";

interface CheckBoxProperty {
  label: string;
  checked: boolean;
}
export default function CheckBox({ label, checked }: CheckBoxProperty) {
  return (
    <VSCodeCheckbox className="padd" autofocus checked={checked}>
      {label}
    </VSCodeCheckbox>
  );
}
