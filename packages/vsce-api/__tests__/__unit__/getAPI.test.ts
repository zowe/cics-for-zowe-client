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

const mockGetExtension = jest.fn().mockReturnValue({
    packageJSON: {
        version: "1.2.3"
    },
    activate: () => {
        return {
            resources: { supportedResources: [ResourceTypes.CICSProgram] }
        } as IExtensionAPI;
    }
});

jest.mock("vscode", () => {
    return {
        extensions: {
            getExtension: mockGetExtension
        }
    };
});

import { getCICSForZoweExplorerAPI } from "../../src/getAPI";
import { IExtensionAPI } from "../../src/interfaces";
import { ResourceTypes } from "../../src/resources";


describe("getAPI tests", () => {

    it("should return API with no minversion", async () => {
        const api = await getCICSForZoweExplorerAPI();
        expect(api).toBeDefined();
        expect(api.resources.supportedResources).toHaveLength(1);
        expect(api.resources.supportedResources[0]).toEqual(ResourceTypes.CICSProgram);
    });

    it("should return API with lower minimum version", async () => {
        const api = await getCICSForZoweExplorerAPI("0.2.3");
        expect(api).toBeDefined();
        expect(api.resources.supportedResources).toHaveLength(1);
        expect(api.resources.supportedResources[0]).toEqual(ResourceTypes.CICSProgram);
    });

    it("should return undefined with higher minimum version", async () => {
        const api = await getCICSForZoweExplorerAPI("2.2.3");
        expect(api).toBeUndefined();
    });

    it("should return undefined with no extension installed", async () => {

        mockGetExtension.mockReturnValue(undefined);

        const api = await getCICSForZoweExplorerAPI();
        expect(api).toBeUndefined();
    });

    it("should return undefined with no extension installed and minimum value", async () => {

        mockGetExtension.mockReturnValue(undefined);

        const api = await getCICSForZoweExplorerAPI("1.5.6");
        expect(api).toBeUndefined();
    });

});