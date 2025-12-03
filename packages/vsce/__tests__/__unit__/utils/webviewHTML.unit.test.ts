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

import * as webviewHTML from "../../../src/utils/webviewHTML";

describe("Webview HTML", () => {
  it("should return valid webview HTML", () => {
    expect(webviewHTML.getAttributesHtml("MY TITLE", "MY TEXT")).toEqual(
      `<!DOCTYPE html>
  <html lang=\"en\">
  <head>
      <meta charset=\"UTF-8\">
      <title>MY TITLE</title>
      <style>
      * {
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }

      thead th {
        position: sticky;
        top: 0;
      }


      table {
        border:1px solid var(--vscode-editor-foreground);
        width: 90%;
        table-layout:fixed
      }
      th {
        border:1px solid var(--vscode-editor-foreground);
      }
      .colHeading {
        width: 30%;
        word-wrap:break-word;
      }
      td {
        border:1px solid var(--vscode-editor-foreground);
        padding: 0.3rem 0.5rem;
        word-wrap:break-word;
        text-align:center;
      }
      h1 {
        width: 100%;
        text-align: center;
        padding: 0.5rem 0;
        text-decoration: underline;
      }
      .valueHeading {
        padding: 0.7rem 0.5rem;
        text-align: center;
        align-items: center;
      }
      .headingTH {
        padding: 0.7rem 0.5rem;
        flex-direction: column;
        align-items: center;
      }
      div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      input {
        text-align: center;
        margin: 0.2rem 0;
        border:1px solid var(--vscode-editor-foreground);
        border-radius: 5px;
      }
      </style>
  </head>
  <body>
  <div>

  <table id=\"resultsTable\">
  MY TEXT
  </table>

  </div>
  <script>
    document.getElementById(\"searchBox\").addEventListener(\"keyup\", (e) => {
      let tableRows = document.getElementsByTagName(\"tr\");
      for(let row of tableRows){
        if(row.children[1].innerText !== 'Value'){
          row.style.display =
              row.children[0].innerText.toUpperCase().includes(e.target.value.toUpperCase()) ? '' : 'none';
        }
      }
    });
  </script>
  </body>
  </html>`
    );
  });

  it("should get parameters HTML", () => {
    expect(webviewHTML.getParametersHtml("MY TITLE", "MY TEXT")).toEqual(
      `<!DOCTYPE html>
  <html lang=\"en\">
  <head>
      <meta charset=\"UTF-8\">
      <title>MY TITLE</title>
      <style>
      * {
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
      }

      thead th {
        position: sticky;
        top: 0;
      }


      table {
        border:1px solid var(--vscode-editor-foreground);
        width: 90%;
        table-layout:fixed
      }
      th {
        border:1px solid var(--vscode-editor-foreground);
      }
      .colHeading {
        width: 30%;
        word-wrap:break-word;
      }
      td {
        border:1px solid var(--vscode-editor-foreground);
        padding: 0.3rem 0.5rem;
        word-wrap:break-word;
        text-align:center;
      }
      h1 {
        width: 100%;
        text-align: center;
        padding: 0.5rem 0;
        text-decoration: underline;
      }
      .valueHeading {
        padding: 0.7rem 0.5rem;
        flex-direction: column;
        align-items: center;
      }
      .sourceHeading {
        padding: 0.7rem 0.5rem;
        flex-direction: column;
        align-items: center;
      }
      .headingTH {
        padding: 0.7rem 0.5rem;
        flex-direction: column;
        align-items: center;
      }
      div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      input {
        text-align: center;
        margin: 0.2rem 0;
        border:1px solid var(--vscode-editor-foreground);
        border-radius: 5px;
      }
      </style>
  </head>
  <body>
  <div>

  <table id=\"resultsTable\">
  <colgroup>
    <col span=\"1\" style=\"width: 30%;\">
    <col span=\"1\" style=\"width: 20%;\">
    <col span=\"1\" style=\"width: 50%;\">
  </colgroup>
  MY TEXT
  </table>

  </div>
  <script>
  let keyword = '';
  let source = 'COMBINED';
    document.getElementById(\"searchBox\").addEventListener(\"keyup\", (e) => {
      keyword = e.target.value.toUpperCase();
      let tableRows = document.getElementsByTagName(\"tr\");
      for(let row of tableRows){
        if(row.children[2].innerText !== 'Value'){
          if(source !== 'COMBINED'){
            if(row.children[0].innerText.toUpperCase().includes(keyword) && row.children[1].innerText.toUpperCase().includes(source))
            {
              row.style.display = '';
            } else{
              row.style.display = 'none';
            }
          } else {
            row.style.display = row.children[0].innerText.toUpperCase().includes(keyword) ? '' : 'none';
          }
        }
      }
    });
    document.getElementById(\"filterSource\").addEventListener(\"change\", (e) => {
      source = e.target.value.toUpperCase();
      let tableRows = document.getElementsByTagName(\"tr\");
      for(let row of tableRows){
        if(row.children[2].innerText !== 'Value'){
          if(source !== 'COMBINED'){
            if(row.children[0].innerText.toUpperCase().includes(keyword) && row.children[1].innerText.toUpperCase().includes(source))
            {
              row.style.display = '';
            } else{
              row.style.display = 'none';
            }
          } else{
            row.style.display = row.children[0].innerText.toUpperCase().includes(keyword) ? '' : 'none';
          }
        }
      }
    });
  </script>
  </body>
  </html>`
    );
  });
});
