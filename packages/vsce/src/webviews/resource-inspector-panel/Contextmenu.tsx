import { VscodeContextMenu } from "@vscode-elements/react-elements";
import * as React from "react";
import { Uri } from "vscode";
import * as vscode from "../common/vscode";
import "../css/style.css";

const Contextmenu = ({
  resourceActions,
  refreshIconPath,
}: {
  resourceActions: { id: string; name: string; iconPath?: { light: Uri; dark: Uri } }[];
  refreshIconPath: { light: string; dark: string };
}) => {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [show, setShow] = React.useState(false);
  const [vscodeTheme, setVscodeTheme] = React.useState<"light" | "dark">("light");

  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const threeDotsRef = React.useRef<HTMLDivElement | null>(null);

  // Open dropdown and positioning it at three dots
  const handleThreeDotsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    setX(rect.left);
    setY(rect.top + rect.height);
    setShow(true);
    event.stopPropagation();
  };

  // Theme Detection
  React.useEffect(() => {
    const getTheme = () => {
      if (document.body.classList.contains("vscode-dark")) return "dark";
      return "light";
    };
    setVscodeTheme(getTheme());
    const observer = new MutationObserver(() => {
      setVscodeTheme(getTheme());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Handle click outside to close
  React.useEffect(() => {
    if (!show) return;
    const clickHandler = (event: MouseEvent) => {
      const menuEl = menuRef.current;
      const dotsEl = threeDotsRef.current;
      if (menuEl && !menuEl.contains(event.target as Node) && dotsEl && !dotsEl.contains(event.target as Node)) {
        setShow(false);
      }
    };
    window.addEventListener("mousedown", clickHandler);
    return () => window.removeEventListener("mousedown", clickHandler);
  }, [show]);

  // When window loses focus, closing dropdown
  React.useEffect(() => {
    if (!show) return;
    const onBlur = () => setShow(false);
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [show]);

  // Handle menu item selection
  React.useEffect(() => {
    if (!show) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const handleSelect = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const { value } = customEvent.detail;
      vscode.postVscMessage({ command: "action", actionId: value });
      setShow(false);
    };
    menuEl.addEventListener("vsc-context-menu-select", handleSelect as EventListener);
    return () => {
      menuEl.removeEventListener("vsc-context-menu-select", handleSelect as EventListener);
    };
  }, [show]);

  // Refresh handler
  const handleRefresh = () => {
    vscode.postVscMessage({ command: "refresh" });
  };

  return (
    <div className="dropdown-container">
      <img
        src={vscodeTheme === "dark" ? refreshIconPath.dark : refreshIconPath.light}
        className="refresh-icon"
        width={14}
        height={14}
        onClick={handleRefresh}
      />
      <div id="three-dots" className="three-dots" onClick={handleThreeDotsClick} ref={threeDotsRef}>
        ...
      </div>
      {show && (
        <VscodeContextMenu
          data={resourceActions.map(({ id, name }) => ({ label: name, value: id }))}
          show={true}
          ref={menuRef}
          style={
            {
              position: "fixed",
              top: y,
              left: x - 180,
              zIndex: 1000,
              fontWeight: "900",
              minWidth: 180,
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
};

export default Contextmenu;
