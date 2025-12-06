const realImperative = jest.requireActual('@zowe/imperative');

module.exports = {
    ...realImperative,
    AuthOrder: {
        makingRequestForToken: jest.fn().mockImplementation(() => { }),
    },
};
