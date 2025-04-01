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

let fs = require('fs');
let path = require('path');

const jsonFilePath = path.resolve(__dirname, '../__e2e__/resources/test/config-files/zowe.config.json');
const wiremock_profile = {
    "wiremock_server": {
         "type": "cics",
         "properties": {
             "host": "localhost",
             "port": 8080,
             "rejectUnauthorized": false,
             "protocol": "http"
            }
    }
};

let jsonOriginalProfile: object;

export function addWiremockProfileToConfigFile(): void {
    const jsonFile = require(jsonFilePath);
    jsonOriginalProfile = {...jsonFile.profiles};
    const newProfile = {
        ...jsonFile.profiles,
        ...wiremock_profile
    };
    jsonFile.profiles = newProfile;
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonFile, null, 2), 'utf8');
};

export function restoreOriginalConfigFile(): void {
    const jsonFile = require(jsonFilePath);
    if(jsonFile.profiles && jsonFile.profiles.hasOwnProperty('wiremock_server')){
        jsonFile.profiles = jsonOriginalProfile;
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonFile, null, 2), 'utf8');
    }
};

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}