import { VscodeCheckbox } from "@vscode-elements/react-elements";

interface CheckBoxProperty {
  label: string;
  checked: boolean;
  styles?: string | undefined;
  onchange?: ((e: Event) => void) | undefined;
  imgPath?: string | undefined;
}
export default function CheckBox(prop: CheckBoxProperty) {
  return (
    <VscodeCheckbox className={prop.styles} checked={prop.checked} onChange={prop.onchange}>
      <img src={prop.imgPath} alt={prop.imgPath} height="15px" width="15px" className="icon-style" /> {prop.label}
    </VscodeCheckbox>
  );
}
