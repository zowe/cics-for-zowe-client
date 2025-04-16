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
const getImg = (item: string) => {
  //Dark theme color
  const darkTheme = "#252526";

  //fetching theme color from css
  const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--theme-color");
  
  let theme = "-" + "dark.svg";
  if (themeColor.includes(darkTheme)) {
    theme = "-" + "light.svg";
  }
  return "webviews/public/" + item.substring(4).toLowerCase() + theme;
};

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
          children={
            <CheckBox
              label={val.humanReadableName}
              checked={val.visible}
              onchange={(e) => {
                val.visible = (e.target as HTMLInputElement).checked;
              }}
              imgPath={getImg(val.resourceName)}
            ></CheckBox>
          }
        ></PanelView>
      ))}
    </VSCodePanels>
  );
}
