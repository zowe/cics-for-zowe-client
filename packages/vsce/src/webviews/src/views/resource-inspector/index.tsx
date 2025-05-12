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
import ReactDOM from "react-dom/client";
import { App } from "./App";

// Get the root element where you want to mount your React app
const root = ReactDOM.createRoot(document.getElementById("webviewRoot")!);
root.render(<App />);

//For HMR in dev environment
if (import.meta.hot) {
  import.meta.hot.accept();
}
