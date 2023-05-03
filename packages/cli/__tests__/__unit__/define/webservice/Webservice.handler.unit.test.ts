/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import { CommandProfiles, IHandlerParameters, IProfile, Session } from "@zowe/imperative";
import { ICMCIApiResponse } from "../../../../src";
import { WebServiceDefinition } from "../../../../src/define/webservice/Webservice.definition";
import WebServiceHandler from "../../../../src/define/webservice/Webservice.handler";

jest.mock("../../../../src/api/methods/define");
const Define = require("../../../../src/api/methods/define");

const host = "somewhere.com";
const port = "43443";
const user = "someone";
const password = "somesecret";
const protocol = "http";
const rejectUnauthorized = false;

const PROFILE_MAP = new Map<string, IProfile[]>();
PROFILE_MAP.set(
    "cics", [{
        name: "cics",
        type: "cics",
        host,
        port,
        user,
        password
    }]
);
const PROFILES: CommandProfiles = new CommandProfiles(PROFILE_MAP);
const DEFAULT_PARAMETERS: IHandlerParameters = {
    arguments: {$0: "", _: []}, // Please provide arguments later on
    positionals: ["cics", "define", "webservice"],
    response: {
        data: {
            setMessage: jest.fn((setMsgArgs) => {
                expect(setMsgArgs).toMatchSnapshot();
            }) as any,
            setObj: jest.fn((setObjArgs) => {
                expect(setObjArgs).toMatchSnapshot();
            }),
            setExitCode: jest.fn()
        },
        console: {
            log: jest.fn((logs) => {
                expect(logs.toString()).toMatchSnapshot();
            }) as any,
            error: jest.fn((errors) => {
                expect(errors.toString()).toMatchSnapshot();
            }) as any,
            errorHeader: jest.fn(() => undefined) as any
        },
        progress: {
            startBar: jest.fn((parms) => undefined),
            endBar: jest.fn(() => undefined)
        },
        format: {
            output: jest.fn((parms) => {
                expect(parms).toMatchSnapshot();
            })
        }
    },
    definition: WebServiceDefinition,
    fullDefinition: WebServiceDefinition,
    profiles: PROFILES
};

describe("DefineWebserviceHandler", () => {
    const websvcName = "testWebsvc";
    const csdGroup = "testGroup";
    const pipelineName = "testPipeline";
    const wsBind = "testWsbind";
    const regionName = "testRegion";
    const cicsPlex = "testPlex";

    const defaultReturn: ICMCIApiResponse = {
        response: {
            resultsummary: {api_response1: "1024", api_response2: "0", recordcount: "0", displayed_recordcount: "0"},
            records: "testing"
        }
    };

    const functionSpy = jest.spyOn(Define, "defineWebservice");

    beforeEach(() => {
        functionSpy.mockClear();
        functionSpy.mockImplementation(async () => defaultReturn);
    });

    it("should call the defineWebservice api", async () => {
        const handler = new WebServiceHandler();

        const commandParameters = {...DEFAULT_PARAMETERS};
        commandParameters.arguments = {
            ...commandParameters.arguments,
            webserviceName: websvcName,
            csdGroup,
            pipelineName,
            wsbind: wsBind,
            regionName,
            cicsPlex,
            host,
            port,
            user,
            password,
            rejectUnauthorized,
            protocol
        };

        await handler.process(commandParameters);

        expect(functionSpy).toHaveBeenCalledTimes(1);
        const testProfile = PROFILE_MAP.get("cics")[0];
        expect(functionSpy).toHaveBeenCalledWith(
            new Session({
                type: "basic",
                hostname: testProfile.host,
                port: testProfile.port,
                user: testProfile.user,
                password: testProfile.password,
                rejectUnauthorized,
                protocol
            }),
            {
                name: websvcName,
                csdGroup,
                pipelineName,
                wsBind,
                regionName,
                cicsPlex
            }
        );
    });
});
