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

import { readFileSync } from "fs";
import { join } from "path";

export const nodataXmlResponse = readFileSync(join(__dirname, "nodata.xml")).toString();
export const ok1RecordXmlResponse = readFileSync(join(__dirname, "ok.1_record.xml")).toString();
export const ok2RecordsXmlResponse = readFileSync(join(__dirname, "ok.2_records.xml")).toString();
export const okCacheXmlResponse = readFileSync(join(__dirname, "ok.cache.xml")).toString();

export const okContent1Record: any = {
  response: {
    xmlns: "http://www.ibm.com/xmlns/prod/CICS/smw2int",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "xsi:schemaLocation": "http://www.ibm.com/xmlns/prod/CICS/smw2int http://my.url.host:12345/CICSSystemManagement/schema/CICSSystemManagement.xsd",
    version: "3.0",
    connect_version: "0620",
    resultsummary: {
      api_response1: "1024",
      api_response2: "0",
      api_response1_alt: "OK",
      api_response2_alt: "",
      recordcount: "1",
      displayed_recordcount: "1",
    },
    records: {
      cicsmanagedregion: {
        _keydata: "C9E8C3E6C5D7E6F1",
        actvtime: "",
        ainsfail: "CONTINUE",
        applid: "REGION1",
        autoinst: "NEVER",
        bastrace: "00000000",
        botrsupd: "1",
        chetrace: "00000000",
        cicsname: "REGION1",
        cicssamp: "0",
        cicsstate: "ACTIVE",
        cmasname: "MYCMAS",
        comtrace: "00000000",
        connsamp: "0",
        cpsmver: "0620",
        dattrace: "00000000",
        daylghtsv: "NO",
        dbxsamp: "0",
        desc: "my region",
        filesamp: "0",
        glblsamp: "0",
        host: "",
        jrnlsamp: "0",
        knltrace: "00000000",
        mastrace: "00000000",
        mastype: "LOCAL",
        monstatus: "NO",
        msgtrace: "00000000",
        mxtaction: "",
        mxtsev: "HS",
        networkid: "",
        nrmaction: "",
        nrmsev: "N_A",
        port: "",
        pricmas: "",
        progsamp: "0",
        quetrace: "00000000",
        readrs: "200",
        retention: "0",
        rtastatus: "SAM",
        rtatrace: "00000000",
        samaction: "",
        samsev: "VHS",
        sdmaction: "",
        sdmsev: "VHS",
        secbypass: "NO",
        seccmdchk: "NO",
        secreschk: "NO",
        sosaction: "",
        sossev: "HS",
        srvtrace: "00000000",
        stlaction: "",
        stlsev: "VHS",
        tdmaction: "",
        tdmsev: "HW",
        tdqsamp: "0",
        termsamp: "0",
        tmezone: "Z",
        tmezoneo: "0",
        toprsupd: "5",
        toptrace: "00000000",
        transamp: "0",
        tratrace: "00000000",
        updaters: "15",
        wlmopten: "DISABLED",
        wlmqmode: "ALL",
        wlmstatus: "NO",
        wlmthrsh: "60",
        wlmtrace: "00000000",
      },
    },
  },
};

export const okCache: any = {
  response: {
    xmlns: "http://www.ibm.com/xmlns/prod/CICS/smw2int",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "xsi:schemaLocation": "http://www.ibm.com/xmlns/prod/CICS/smw2int http://my.url.host:12345/CICSSystemManagement/schema/CICSSystemManagement.xsd",
    version: "3.0",
    connect_version: "0620",
    resultsummary: {
      api_response1: "1024",
      api_response2: "0",
      api_response1_alt: "OK",
      api_response2_alt: "",
      recordcount: "2",
      cachetoken: "E046A6E795FB9E13",
    },
  },
};

export const okContent2Records: any = {
  response: {
    xmlns: "http://www.ibm.com/xmlns/prod/CICS/smw2int",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "xsi:schemaLocation": "http://www.ibm.com/xmlns/prod/CICS/smw2int http://my.url.host:12345/CICSSystemManagement/schema/CICSSystemManagement.xsd",
    version: "3.0",
    connect_version: "0620",
    resultsummary: {
      api_response1: "1024",
      api_response2: "0",
      api_response1_alt: "OK",
      api_response2_alt: "",
      recordcount: "2",
      displayed_recordcount: "2",
    },
    records: {
      cicscicsplex: [
        {
          _keydata: "C3C9C3E2C5E7F6F2C9E8C3E6C5D7C3D4",
          accesstype: "LOCAL",
          botrsupd: "1",
          cmasname: "REGION1",
          mpstatus: "YES",
          plexname: "PLEX01",
          readrs: "200",
          rspoolid: "DFHRSTAT",
          status: "ACTIVE",
          sysid: "EPCM",
          toprsupd: "5",
          transitcmas: "",
          transitcnt: "0",
          updaters: "15",
        },
        {
          _keydata: "C4E4D4D4E8F9F0F7C9E8C3E6C5D7C3D4",
          accesstype: "LOCAL",
          botrsupd: "1",
          cmasname: "REGION1",
          mpstatus: "YES",
          plexname: "PLEX02",
          readrs: "200",
          rspoolid: "DFHRSTAT",
          status: "ACTIVE",
          sysid: "EPCM",
          toprsupd: "5",
          transitcmas: "",
          transitcnt: "0",
          updaters: "15",
        },
      ],
    },
  },
};

export const nodataContent: any = {
  response: {
    xmlns: "http://www.ibm.com/xmlns/prod/CICS/smw2int",
    "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    "xsi:schemaLocation": "http://www.ibm.com/xmlns/prod/CICS/smw2int http://my.url.host:12345/CICSSystemManagement/schema/CICSSystemManagement.xsd",
    version: "3.0",
    connect_version: "0620",
    resultsummary: {
      api_source: "CICSPlex SM",
      api_function: "GET",
      api_response1: "1027",
      api_response2: "0",
      api_response1_alt: "NODATA",
      api_response2_alt: "",
      recordcount: "0",
    },
    records: {
      cicscicsplex: [],
    },
  },
};
