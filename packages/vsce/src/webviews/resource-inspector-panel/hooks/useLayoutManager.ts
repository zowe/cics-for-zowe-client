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
import * as vscode from "../../common/vscode";

/**
 * Custom hook to manage layout-related functionality
 */
export const useLayoutManager = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const getLayoutElements = () => {
    const headerElement1 = document.getElementById("resource-info-table-header");
    const headerElement2 = document.getElementById("attributes-header");
    const mainDiv = document.querySelector(".resource-inspector-container");
    return { headerElement1, headerElement2, mainDiv };
  };

  const getCssVariables = () => {
    const styles = getComputedStyle(document.documentElement);
    return {
      headerTopSpacing: styles.getPropertyValue('--header-top-spacing'),
      maskTopPosition: styles.getPropertyValue('--mask-top-position'),
      maskLeftPosition: styles.getPropertyValue('--mask-left-position')
    };
  };

  // Common function to handle attribute header mask creation and positioning
  const createOrUpdateMaskElement = (id: string, className: string) => {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement("div");
      element.id = id;
      element.className = className;
      document.body.appendChild(element);
    }
    return element;
  };

  const updateAttributeHeaderMaskWithScroll = (headerElement: HTMLElement | null, createIfMissing: boolean = false) => {
    if (!headerElement) return;
    let attrHeaderMask = document.getElementById("attribute-header-mask");
    if (!attrHeaderMask && createIfMissing) {
      attrHeaderMask = createOrUpdateMaskElement("attribute-header-mask", "attribute-header-mask");
    }
    
    if (attrHeaderMask) {
      const attrHeaderRect = headerElement.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 0) {
        attrHeaderMask.style.display = "block";
        attrHeaderMask.style.top = attrHeaderRect.top + "px";
        attrHeaderMask.style.height = attrHeaderRect.height + "px";
        attrHeaderMask.style.left = attrHeaderRect.left + "px";
        attrHeaderMask.style.width = attrHeaderRect.width + "px";
      } else {
        attrHeaderMask.style.display = "none";
      }
    }
  };

  React.useEffect(() => {
    const handleResize = () => {
      const { headerElement1, headerElement2, mainDiv } = getLayoutElements();

      if (headerElement1 && headerElement2 && mainDiv) {
        headerElement1.style.width = "";
        const contentWidth = mainDiv.clientWidth;
        headerElement2.style.width = contentWidth + "px";
        const maskElement = createOrUpdateMaskElement("header-mask", "header-mask");
        maskElement.style.width = "100%";
        updateAttributeHeaderMaskWithScroll(headerElement2, false);
      }
    };

    const handleScroll = () => {
      const { headerElement1, headerElement2, mainDiv } = getLayoutElements();
  
      if (headerElement1 && headerElement2 && mainDiv) {
        // Get CSS variables
        const { headerTopSpacing, maskTopPosition, maskLeftPosition } = getCssVariables();
        headerElement1.style.top = headerTopSpacing;
        const firstHeaderHeight = headerElement1.offsetHeight;
        const headerTopSpacingValue = parseInt(headerTopSpacing);
        headerElement2.style.top = `${headerTopSpacingValue + firstHeaderHeight}px`;
        const contentWidth = mainDiv.clientWidth;
        headerElement2.style.width = contentWidth + "px";
        const maskElement = createOrUpdateMaskElement("header-mask", "header-mask");
        maskElement.style.top = maskTopPosition;
        maskElement.style.height = `${headerTopSpacingValue + firstHeaderHeight}px`;
        maskElement.style.left = maskLeftPosition;
        maskElement.style.width = "100%";
        updateAttributeHeaderMaskWithScroll(headerElement2, true);
      }
    };
    vscode.addScrollerListener(handleScroll);
    vscode.addResizeListener(handleResize);
    
    setTimeout(() => {
      handleScroll();
      handleResize();
    }, 0);
    return () => {
      window.removeEventListener('resize', handleResize);
      const headerMask = document.getElementById("header-mask");
      if (headerMask) {
        headerMask.remove();
      }
      const attrHeaderMask = document.getElementById("attribute-header-mask");
      if (attrHeaderMask) {
        attrHeaderMask.remove();
      }
    };
  }, []);

  return {
    containerRef,
  };
};

export default useLayoutManager;

