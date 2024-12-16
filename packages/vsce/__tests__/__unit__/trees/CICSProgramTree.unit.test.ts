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

const getIconPathInResourcesMock = jest.fn();

import { imperative } from "@zowe/zowe-explorer-api";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { CICSProgramTreeItem } from "../../../src/trees/treeItems/CICSProgramTreeItem";
import * as filterUtils from "../../../src/utils/filterUtils";
import { CICSProgramTree } from "../../../src/trees/CICSProgramTree";

jest.mock("@zowe/cics-for-zowe-sdk");
const zoweSdk = require("@zowe/cics-for-zowe-sdk");
const sessionMock = jest.fn();

jest.mock("../../../src/utils/profileUtils", () => {
    return { getIconPathInResources: getIconPathInResourcesMock };
});

jest.mock("../../../src/trees/treeItems/CICSProgramTreeItem", () => {
    return { CICSProgramTreeItem: jest.fn() };
});
const imperativeSession = new imperative.Session({
    user: "fake",
    password: "fake",
    hostname: "fake",
    protocol: "https",
    type: "basic",
    rejectUnauthorized: false,
});
const CICSSessionTreeMock = {
    session: imperativeSession,
};

const cicsRegionTreeMock = {
    parentSession: CICSSessionTreeMock,
    getRegionName: jest.fn(() => "IYK2ZXXXX"),
};
const CICSProgramTreeItemMock = {};
const getResourceMock = jest.spyOn(zoweSdk, "getResource");
const iconPath = "/icon/path";
const resourceName = "testResource";
const cicsprogram = "cicsprogram";
const value = "NOT (PROGRAM=CEE* OR PROGRAM=DFH* OR PROGRAM=CJ* OR PROGRAM=EYU* OR PROGRAM=CSQ* OR PROGRAM=CEL* OR PROGRAM=IGZ*)";
const defaultReturn: ICMCIApiResponse = {
    response: {
        resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0" },
        records: {},
    },
};

class CustomError extends Error {
    mMessage: String | undefined;
    constructor(mMessage: String) {
        super();
        this.mMessage = mMessage;
    }
}

describe("Test suite for CICSProgramTree", () => {
    let sut: CICSProgramTree;

    beforeEach(() => {
        getIconPathInResourcesMock.mockReturnValue(iconPath);
        sut = new CICSProgramTree(cicsRegionTreeMock as any as CICSRegionTree);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("Test suite for addProgram()", () => {
        it("Should add CICSProgramTreeItem into program", () => {
            sut.addProgram(CICSProgramTreeItemMock as any as CICSProgramTreeItem);
            expect(sut.children.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe("Test suite for loadContents()", () => {
        let getDefaultProgramFilter: jest.SpyInstance;

        beforeEach(() => {
            sessionMock.mockReturnValue(imperativeSession);
            getDefaultProgramFilter = jest.spyOn(filterUtils, "getDefaultProgramFilter").mockResolvedValueOnce(value);
            getResourceMock.mockImplementation(async () => defaultReturn);
        });
        afterEach(() => {
            getResourceMock.mockClear();
            jest.resetAllMocks();
        });

        it("Should invoke getDefaultProgramFilter when activeFilter is undefined", async () => {
            defaultReturn.response.records[resourceName.toLowerCase()] = [{ prop: "test1" }, { prop: "test2" }];

            await sut.loadContents();
            expect(getDefaultProgramFilter).toHaveBeenCalled();
            expect(sut.activeFilter).toBeUndefined();
        });

        it("Should invoke toEscapedCriteriaString when activeFilter is defined", async () => {
            sut.activeFilter = "Active";
            defaultReturn.response.records[cicsprogram.toLowerCase()] = [{ prop: "test1" }, { prop: "test2" }];
            const toEscapedCriteriaString = jest.spyOn(filterUtils, "toEscapedCriteriaString").mockReturnValueOnce("PROGRAM");

            await sut.loadContents();
            expect(toEscapedCriteriaString).toHaveBeenCalled();
            expect(sut.activeFilter).toBeDefined();
        });

        it("Should throw exception when error.mMessage include {exceeded a resource limit}", async () => {
            getResourceMock.mockRejectedValue(new CustomError("Error in the method exceeded a resource limit"));
            await sut.loadContents();
            expect(getResourceMock).toHaveBeenCalled();
        });

        it("Should throw exception when error.mMessage include {exceeded a resource limit}", async () => {
            getResourceMock.mockRejectedValue(new CustomError("Error in the method"));
            await sut.loadContents();
            expect(getResourceMock).toHaveBeenCalled();
            expect(sut.label).toEqual("Programs [0]");
        });
    });

    describe("Test suite for clearFilter", () => {
        it("Should clear active filter", () => {
            sut.activeFilter = "Active";
            sut.clearFilter();
            expect(sut.activeFilter).toBeUndefined();
        });
    });

    describe("Test suite for setFilter", () => {
        it("Should clear active filter", () => {
            sut.activeFilter = "Active";
            sut.setFilter("Active");
            expect(sut.activeFilter).toEqual("Active");
        });
    });

    describe("Test suite for getFilter", () => {
        it("Should return activeFilter object", () => {
            expect(sut.getFilter()).toBe(sut.activeFilter);
        });
    });

    describe("Test suite for getParent", () => {
        it("Should return parentRegion object", () => {
            expect(sut.getParent()).toBe(sut.parentRegion);
        });
    });
});
