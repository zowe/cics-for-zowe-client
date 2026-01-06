/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Uri } from "vscode";
import "../css/style.css";

const Contextmenu = ({
  resourceActions,
}: {
  resourceActions: { id: string; name: string; iconPath?: { light: Uri; dark: Uri; }; }[];
}) => {

  const [showActionMenu, setShowActionMenu] = useState(false);
  const ref = useRef(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setShowActionMenu(!showActionMenu);
    }
  };

  useEffect(() => {
    window.addEventListener("mousedown", handleClickOutside, !showActionMenu);

    return () => {
      window.removeEventListener(
        "mousedown",
        handleClickOutside,
        !showActionMenu
      );
    };
  });

  const MenuDot = () => (
    <span className="w-1 text-sm codicon codicon-circle-small-filled" />
  );
  const Menu = () => (
    <button
      className="cursor-pointer flex gap-0.5 items-center justify-center"
      ref={ref}
      onClick={() => { setShowActionMenu(!showActionMenu); }}
    >
      <MenuDot /><MenuDot /><MenuDot />
    </button>
  );

  return (
    <>
      <Menu />

      {showActionMenu &&
        createPortal(
          <div
            className="absolute z-50 top-12 right-8 bg-[var(--vscode-editorWidget-background)] shadow-lg rounded"
            ref={ref}
          >
            {resourceActions?.map(({ id, name }) => (
              <div key={id} className="w-full px-4 py-2 hover:bg-[var(--vscode-list-hoverBackground)] cursor-pointer">
                {name}
              </div>
            ))}
          </div>,
          document.getElementById("portal-root")
        )
      }

      {/* <div className={`fixed z-20 top-4 right-4 ${showActionMenu ? '' : 'hidden'}`}>
        {resourceActions?.map(({ id, name }) => (
          <div key={id} className="w-full bg-white">
            {name}
          </div>
        ))}
      </div> */}
    </>
  );
};

export default Contextmenu;
