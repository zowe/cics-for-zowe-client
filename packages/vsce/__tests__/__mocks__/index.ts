

import { imperative } from "@zowe/zowe-explorer-api";

export const getJesApiMock = jest.fn();
getJesApiMock.mockReturnValue(true);

export const getResourceMock = jest.fn();

export const createProfile = (name: string, type: string, host: string, user?: string) => {
    return {
        name: name,
        message: "",
        type: type,
        failNotFound: false,
        profile: {
            user: user,
            host: host,
        },
    } as imperative.IProfileLoaded;
};
