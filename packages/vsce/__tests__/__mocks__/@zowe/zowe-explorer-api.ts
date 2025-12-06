
import { createProfile, getJesApiMock } from "../";

const zeApi: any = jest.createMockFromModule('@zowe/zowe-explorer-api');

zeApi.ZoweVsCodeExtension = {
    getZoweExplorerApi: jest.fn().mockReturnValue({
        getZoweExplorerApi: jest.fn(),
        getExplorerExtenderApi: jest.fn().mockReturnValue({
            getProfilesCache: jest.fn().mockReturnValue({

                fetchBaseProfile: jest.fn().mockImplementation((name: string) => {
                    if (name === "exception") {
                        throw Error("Error");
                    }
                    const splitString = name.split(".");
                    if (splitString.length > 1) {
                        return createProfile(splitString[0], "base", "", "");
                    }
                    return undefined;
                }),

                refresh: jest.fn(),
            }),
            initForZowe: jest.fn(),
        }),
        getJesApi: getJesApiMock,
    })
};

zeApi.ZoweExplorerApiType = {
    Uss: "USS",
    Jes: "JES",
};

module.exports = zeApi;