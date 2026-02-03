import { VscodeContextMenu } from "@vscode-elements/react-elements";
import * as React from "react";
import { Uri } from "vscode";
import * as vscode from "../common/vscode";
import "../css/style.css";

const Contextmenu = ({
  resourceActions,
  refreshIconPath,
  isDarkTheme,
}: {
  resourceActions: { id: string; name: string; iconPath?: { light: Uri; dark: Uri } }[];
  refreshIconPath: { light: string; dark: string };
  isDarkTheme: boolean;
}) => {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [show, setShow] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const threeDotsRef = React.useRef<HTMLDivElement | null>(null);

  // Open dropdown and positioning it at three dots
  const handleThreeDotsClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (show) {
      setShow(false); // Close if already open
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setX(rect.left);
      setY(rect.top + rect.height);
      setShow(true);
    }
    event.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      // Prevent the default to avoid scrolling when Space is pressed
      event.preventDefault();
      // Call your existing click handler logic
      handleThreeDotsClick(event as unknown as React.MouseEvent);
    }
  };

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

  const showThreeDots = resourceActions.length > 0;

  return (
    <div className="dropdown-container">
      <img
        id="refresh-icon"
        src={isDarkTheme ? refreshIconPath.dark : refreshIconPath.light}
        className="refresh-icon"
        onClick={handleRefresh}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleRefresh();
          }
        }}
      />
      {showThreeDots && (
        <div id="three-dots" className="three-dots" onClick={handleThreeDotsClick} ref={threeDotsRef} tabIndex={0} onKeyDown={handleKeyDown}>
          ...
        </div>
      )}
      {show && (
        <VscodeContextMenu
          data={resourceActions.map(({ id, name }) => ({ label: name, value: id }))}
          show={true}
          ref={menuRef}
          style={
            {
              position: "absolute",
              top: y,
              right: "-20px",
              fontWeight: "900",
              minWidth: 0, // Allow shrinking to content width
              paddingLeft: "2px", // Set 2px left padding
              whiteSpace: "nowrap",
            } as React.CSSProperties
          }
        />
      )}
    </div>
  );
};

export default Contextmenu;
