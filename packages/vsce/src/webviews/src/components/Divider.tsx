import { VSCodeDivider } from "@vscode/webview-ui-toolkit/react";

interface Prop {
  styles?: string | undefined;
}
export default function Divider(prop: Prop) {
  return <VSCodeDivider className={prop.styles}></VSCodeDivider>;
}
