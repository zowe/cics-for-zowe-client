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

import { compare } from 'compare-versions';
import { extensions } from "vscode";
import { IExtensionAPI } from './interfaces';

export async function getCICSForZoweExplorerAPI(minimumVersion?: string): Promise<IExtensionAPI | undefined> {

    const cicsExtension = extensions.getExtension("Zowe.cics-extension-for-zowe");

    if (!cicsExtension) {
        return undefined;
    }

    if (minimumVersion) {
        const version: string = cicsExtension.packageJSON.version;

        if (compare(version, minimumVersion, "<")) {
            return undefined;
        }
    }

    return cicsExtension.activate();
}
