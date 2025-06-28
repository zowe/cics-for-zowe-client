import { compare } from 'compare-versions';
import { extensions } from "vscode";
import { IExtensionAPI } from './interfaces';

export async function getCICSForZoweExplorerAPI(minimumVersion?: string): Promise<IExtensionAPI> {

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

    return await cicsExtension.activate();
}
