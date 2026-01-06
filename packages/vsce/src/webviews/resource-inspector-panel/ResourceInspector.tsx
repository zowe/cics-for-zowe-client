// /**
//  * This program and the accompanying materials are made available under the terms of the
//  * Eclipse Public License v2.0 which accompanies this distribution, and is available at
//  * https://www.eclipse.org/legal/epl-v20.html
//  *
//  * SPDX-License-Identifier: EPL-2.0
//  *
//  * Copyright Contributors to the Zowe Project.
//  *
//  */


// import * as React from "react";
// import * as vscode from "../common/vscode";

// import { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
// import Table from "../common/Table2";
// import Breadcrumb from "./Breadcrumb";

// const ResourceInspector = () => {
//   const [search, setSearch] = React.useState("");

//   const highlightAttributes = ["openstatus", "enablestatus", "vsamtype", "browse", "read", "update", "keylength", "recordsize", "dsname"];
//   const [showExpanded, setShowExpanded] = React.useState(false);
//   const [resourceHeaders, setResourceHeaders] = React.useState<string[]>([]);
//   const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

//   React.useEffect(() => {
//     if (!resourceInfo) {
//       return;
//     }
//     if (showExpanded) {
//       setResourceRows(resourceInfo.resources.map((res) => [res.name, ...Object.keys(resourceInfo.resources[0].resource).map((attr: keyof IResource) => res.resource[attr])]));
//       setResourceHeaders(["Resource", ...Object.keys(resourceInfo.resources[0].resource).map((attr) => attr.toUpperCase())]);
//     } else {
//       const filteredRows = resourceInfo.resources.map((res) => {
//         let newObj: { [key: string]: string; } = {};
//         for (const [k, v] of Object.entries(res.resource)) {
//           if (highlightAttributes.includes(k)) {
//             newObj[k] = v;
//           }
//         }
//         return newObj;
//       });

//       setResourceRows(filteredRows.map((res) => [res.name, ...Object.keys(filteredRows[0]).map((attr) => res[attr])]));
//       setResourceHeaders(["Resource", ...highlightAttributes]);
//     }
//   }, [showExpanded]);

//   const [resourceInfo, setResourceInfo] = React.useState<{
//     resources: {
//       name: string;
//       resourceIconPath: { light: string; dark: string; };
//       humanReadableNameSingular: string;
//       humanReadableNamePlural: string;
//       highlights: { key: string; value: string; }[];
//       resource: IResource;
//     }[];
//     resourceContext: IResourceProfileNameInfo;
//   }>();

//   const toggleExtended = () => {
//     setShowExpanded(!showExpanded);
//   };

//   const [resourceActions, setResourceActions] = React.useState<{
//     id: string;
//     name: string;
//   }[]>([]);

//   React.useEffect(() => {
//     const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
//       setResourceInfo(event.data.data);
//       setResourceActions(event.data.actions);
//       setSearch("");
//     };
//     vscode.addVscMessageListener(listener);
//     vscode.postVscMessage({ command: "init" });
//     return () => {
//       vscode.removeVscMessageListener(listener);
//     };
//   }, []);

//   const getTableRows = () => {
//     if (!resourceInfo || resourceInfo.resources.length === 0) {
//       return [];
//     }

//     const keys = Object.keys(resourceInfo.resources[0].resource)
//       .filter((key) => !key.startsWith("_"));

//     return keys.map((attrKey) => [
//       attrKey.toUpperCase(),
//       ...resourceInfo.resources.map((res) =>
//         `${res.resource[attrKey as keyof IResource]}`
//       ),
//     ]);
//   };

//   return (
//     <div
//       className="flex flex-col items-start gap-4 py-0 px-4 min-w-lg max-w-6xl"
//       data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>

//       <Breadcrumb
//         resourceContext={resourceInfo?.resourceContext}
//         resources={resourceInfo?.resources}
//         resourceActions={resourceActions}
//       />

//       {/* {resourceInfo?.resources.length === 1 && (
//         <div className="flex flex-col align-top justify-start gap-0.5 px-6">
//           {resourceInfo.resources[0].highlights.map((highlight) => (
//             <div className="w-full flex gap-1" key={highlight.key}>
//               <span className="text-[var(--vscode-breadcrumb-foreground)]">{highlight.key}:</span>
//               <span>{highlight.value}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {resourceInfo?.resources.length === 2 && (
//         <div className="flex justify-evenly gap-8 px-6 w-10/12 lg:w-8/12">
//           {resourceInfo.resources.map((res, idx) => (
//             <div className="flex flex-col basis-full align-top justify-start gap-0.5 px-6 py-4 bg-[var(--vscode-editor-background)] rounded-sm shadow-sm">
//               <p className="font-semibold mb-0.5">{res.name}</p>
//               {res.highlights.map((highlight) => (
//                 <div className="flex gap-1 px-2" key={highlight.key}>
//                   <span className="font-normal text-[var(--vscode-editor-foreground)]">{highlight.key}:</span>
//                   <span className="font-bold text-[var(--vscode-editor-foreground)]">{highlight.value}{highlight.value !== resourceInfo.resources[idx === 0 ? 1 : 0].highlights.find((h) => h.key === highlight.key).value ? " **" : ""}</span>
//                 </div>
//               ))}
//             </div>
//           ))}
//         </div>
//       )} */}

//       {/* <Table
//         headers={["ATTRIBUTE"].concat(
//           resourceInfo?.resources?.map((r) => r.name) ?? []
//         )}
//         rows={getTableRows()}
//         highlightDifference={true}
//       /> */}

//       {!resourceInfo || resourceInfo?.resources.length === 0 ?
//         (<p>Loading resources...</p>)
//         :
//         resourceInfo?.resources.length > 2 ? (
//           <Table
//             headers={resourceHeaders}
//             rows={resourceRows}
//             showExpanded={showExpanded}
//             toggleExtended={toggleExtended}
//           />
//         )
//           :
//           (
//             <Table
//               headers={["Attribute", ...resourceInfo.resources.map((res) => res.name)]}
//               rows={Object.keys(resourceInfo.resources[0].resource).map((attr: keyof IResource) => [attr.toUpperCase(), ...resourceInfo.resources.map((res) => res.resource[attr])])}
//               highlightDifferences={true}
//               showExpanded={showExpanded}
//               toggleExtended={toggleExtended}
//             />
//           )}

//     </div>
//   );
// };

// export default ResourceInspector;