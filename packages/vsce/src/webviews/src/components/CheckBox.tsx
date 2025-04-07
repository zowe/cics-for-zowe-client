import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react";

interface CheckBoxProperty {
  label: String;
}
export default function CheckBox({ label }: CheckBoxProperty) {
  return (
    <>
      <VSCodeCheckbox autofocus>{label}</VSCodeCheckbox>
    </>
  );
}
