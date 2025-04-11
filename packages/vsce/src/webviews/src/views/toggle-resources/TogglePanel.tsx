import { VSCodePanels } from "@vscode/webview-ui-toolkit/react";
import CheckBox from "../../components/CheckBox";
import PanelTab from "../../components/PanelTab";
import PanelView from "../../components/PanelView";

interface metas {
  resourceName: string;
  humanReadableName: string;
  visible: boolean;
}
interface props {
  items: metas[];
}

export default function ToggleResources({ items }: props) {
  const tabProps = [
    {
      id: "id1",
      children: "Resources",
    },
  ];
  return (
    <VSCodePanels>
      {tabProps.map((val) => (
        <PanelTab id={val.id} children={val.children}></PanelTab>
      ))}
      {items.map((val) => (
        <PanelView
          id={val.resourceName}
          styles="set-margin"
          children={<CheckBox label={val.humanReadableName} checked={val.visible}></CheckBox>}
        ></PanelView>
      ))}
    </VSCodePanels>
  );
}
