import { VSCodePanels } from "@vscode/webview-ui-toolkit/react";
import CheckBox from "../../components/CheckBox";
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
  return (
    <>
      <VSCodePanels className="padding-top">
        {items.map((val) => (
          <PanelView
            id={val.resourceName}
            styles="set-margin"
            children={
              <CheckBox
                styles="checkbox-style"
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
    </>
  );
}
