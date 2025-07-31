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

/**
 * Constants to be used by the API
 */
export const CicsCmciConstants = {
  /**
   * Specifies the required part of the REST interface URI
   */
  CICS_SYSTEM_MANAGEMENT: "CICSSystemManagement",

  /**
   * Specifies the required part of the REST interface URI to access system initialization parameters
   */
  CICS_SYSTEM_PARAMETER: "CICSSystemParameter",

  /**
   * Specifies the required part of the REST interface URI to access program definitions
   */
  CICS_DEFINITION_PROGRAM: "CICSDefinitionProgram",

  /**
   * Specifies the required part of the REST interface URI to update installed transactions
   */
  CICS_LOCAL_TRANSACTION: "CICSLocalTransaction",

  /**
   * Specifies the required part of the REST interface URI to access transaction definitions
   */
  CICS_DEFINITION_TRANSACTION: "CICSDefinitionTransaction",

  /**
   * Specifies the required part of the REST interface URI to access program resources
   */
  CICS_PROGRAM_RESOURCE: "CICSProgram",

  /**
   * Specifies the required part of the REST interface URI to access library resources
   */
  CICS_LIBRARY_RESOURCE: "CICSLibrary",

  /**
   * Specifies the required part of the REST interface URI to access library dataset resources
   */
  CICS_LIBRARY_DATASET_RESOURCE: "CICSLibraryDatasetName",

  /**
   * Specifies the required part of the REST interface URI to access URIMap definitions
   */
  CICS_DEFINITION_URIMAP: "CICSDefinitionURIMap",

  /**
   * Specifies the required part of the REST interface URI to access webservice definitions
   */
  CICS_DEFINITION_WEBSERVICE: "CICSDefinitionWebService",

  /**
   * Specifies the required part of the REST interface URI to access program definitions
   */
  CICS_DEFINITION_BUNDLE: "CICSDefinitionBundle",

  /**
   * Specifies the required part of the REST interface URI to access tcp/ip service resources
   */
  CICS_TCPIPSERVICE_RESOURCE: "CICSTCPIPService",

  /**
   * Specifies the required part of the REST interface URI to access pipeline service resources
   */
  CICS_PIPELINE_RESOURCE: "CICSPipeline",

  /**
   * Specifies the required part of the REST interface URI to access pipeline service resources
   */
  CICS_WEBSERVICE_RESOURCE: "CICSWebService",

  /**
   * Specifies the required part of the REST interface URI to access JVM server resources
   */
  CICS_JVMSERVER_RESOURCE: "CICSJVMServer",

  /*
   * Specifies the required part of the REST interface URI to access URIMaps
   */
  CICS_URIMAP: "CICSURIMap",

  /*
   * Specifies the required part of the REST interface URI to access Region Groups
   */
  CICS_CMCI_REGION_GROUP: "CICSRegionGroup",

  /*
   * Specifies the required part of the REST interface URI to access CICS Plexes
   */
  CICS_CMCI_CICS_PLEX: "CICSCICSPlex",

  /*
   * Specifies the required part of the REST interface URI to access Managed Regions
   */
  CICS_CMCI_MANAGED_REGION: "CICSManagedRegion",

  /*
   * Specifies the required part of the REST interface URI to access Regions
   */
  CICS_CMCI_REGION: "CICSRegion",

  /**
   * Specifies the required part of the REST interface URI to access CSD Group definitions
   */

  CICS_CSDGROUP: "CICSCSDGroup",

  /**
   * Specifies the required part of the REST interface URI to access CSD Group in list definitions
   */
  CICS_CSDGROUP_IN_LIST: "CICSCSDGroupInList",

  /**
   * Specifies the Result Cache part of the URI
   */
  CICS_RESULT_CACHE: "CICSResultCache",

  /**
   * ORDERBY parameter
   */
  ORDER_BY: "ORDERBY",

  /**
   * SUMMONLY parameter
   */
  SUMM_ONLY: "SUMMONLY",

  /**
   * NODISCARD parameter
   */
  NO_DISCARD: "NODISCARD",

  /**
   * OVERRIDEWARNINGCOUNT parameter
   */
  OVERRIDE_WARNING_COUNT: "OVERRIDEWARNINGCOUNT",

  /**
   * CRITERIA parameter
   */
  CRITERIA: "CRITERIA",

  /**
   * PARAMETER parameter
   */
  PARAMETER: "PARAMETER",

  /**
   * The CICS CMCI external resource names
   */
  CICS_CMCI_EXTERNAL_RESOURCES: ["CICSLocalTransaction", "CICSRemoteTransaction", "CICSDefinitionTransaction", "CICSLocalFile"],

  /**
   * The CICS CMCI transaction definition
   */
  CICS_CMCI_TRANSACTION_DEFINITION: "CICSDefinitionTransaction",

  /**
   * The CICS CMCI local transaction
   */
  CICS_CMCI_LOCAL_TRANSACTION: "CICSLocalTransaction",

  /**
   * The CICS CMCI remote transaction
   */
  CICS_CMCI_REMOTE_TRANSACTION: "CICSRemoteTransaction",

  /**
   * The CICS CMCI local file
   */
  CICS_CMCI_LOCAL_FILE: "CICSLocalFile",

  /**
   * CICSTask parameter
   */
  CICS_CMCI_TASK: "CICSTask",

  /**
   * The CICS CMCI pipeline
   */
  CICS_CMCI_PIPELINE: "CICSPipeline",

  /**
   * The CICS CMCI web service
   */
  CICS_CMCI_WEB_SERVICE: "CICSWebService",

  /**
   * CICSBundle parameter
   */
  CICS_CMCI_BUNDLE: "CICSBundle",

  /**
   * CICSBundlePart parameter
   */
  CICS_CMCI_BUNDLE_PART: "CICSBundlePart",

  /**
   * CICS CMCI Response 1 Codes
   */
  RESPONSE_1_CODES: {
    /**
     * CMCI RESP 1 Code for OK
     */
    OK: 1024,

    /**
     * CMCI RESP 1 Code for NODATA
     */
    NODATA: 1027,

    /**
     * CMCI RESP 1 Code for INVALIDPARM
     */
    INVALIDPARM: 1028,

    /**
     * CMCI RESP 1 Code for NOTAVAILABLE
     */
    NOTAVAILABLE: 1034,

    /**
     * CMCI RESP 1 Code for INVALIDDATA
     */
    INVALIDDATA: 1041,
  },
};
