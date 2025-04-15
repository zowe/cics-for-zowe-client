import { VscodeCheckbox } from "@vscode-elements/react-elements";

interface CheckBoxProperty {
  label: string;
  checked: boolean;
  styles?: string | undefined;
  onchange?: ((e: Event) => void) | undefined;
}
export default function CheckBox(prop: CheckBoxProperty) {
  return (
    <VscodeCheckbox className={prop.styles} checked={prop.checked} onChange={prop.onchange}>
      {prop.label}
    </VscodeCheckbox>
  );
}
