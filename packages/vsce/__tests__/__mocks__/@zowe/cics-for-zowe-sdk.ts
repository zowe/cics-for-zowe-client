import { getResourceMock } from "..";

const realSDK = jest.requireActual('@zowe/cics-for-zowe-sdk');

module.exports = {
    ...realSDK,
    getResource: getResourceMock,
};