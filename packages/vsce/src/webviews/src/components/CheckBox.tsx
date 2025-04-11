import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";

interface CheckBoxProperty {
  label: string;
  checked: boolean;
  styles?: string | undefined;
}
export default function CheckBox(prop : CheckBoxProperty) {
  return (
    <VSCodeCheckbox className={prop.styles} autofocus checked={prop.checked}>
      {prop.label}
    </VSCodeCheckbox>
  );
}
