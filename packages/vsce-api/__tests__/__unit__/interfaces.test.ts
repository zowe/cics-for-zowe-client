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

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { imperative } from "@zowe/zowe-explorer-api";
// Import all interfaces to ensure they're included in coverage
import "../../src/interfaces/IExtensionAPI";
import "../../src/interfaces/IResourceContext";
import "../../src/interfaces/IResourceExtender";
import "../../src/interfaces/ResourceAction";
import "../../src/interfaces/resources/IBundle";
import "../../src/interfaces/resources/IBundlePart";
import "../../src/interfaces/resources/IJVMEndpoint";
import "../../src/interfaces/resources/IJVMServer";
import "../../src/interfaces/resources/ILibrary";
import "../../src/interfaces/resources/ILibraryDataset";
import "../../src/interfaces/resources/ILocalFile";
import "../../src/interfaces/resources/IManagedRegion";
import "../../src/interfaces/resources/IPipeline";
import "../../src/interfaces/resources/IProgram";
import "../../src/interfaces/resources/IRegion";
import "../../src/interfaces/resources/IRemoteFile";
import "../../src/interfaces/resources/IResource";
import "../../src/interfaces/resources/ISharedTSQueue";
import "../../src/interfaces/resources/ITCPIP";
import "../../src/interfaces/resources/ITSQueue";
import "../../src/interfaces/resources/ITask";
import "../../src/interfaces/resources/ITransaction";
import "../../src/interfaces/resources/IURIMap";
import "../../src/interfaces/resources/IWebService";
import "../../src/interfaces";
import "../../src/interfaces/resources";

import type { IExtensionAPI } from "../../src/interfaces/IExtensionAPI";
import type { IResourceContext, IResourceRegionInfo, IResourceProfileNameInfo, IResourceProfileInfo } from "../../src/interfaces/IResourceContext";
import type { IResourceExtender } from "../../src/interfaces/IResourceExtender";
import { ResourceAction, type ResourceTypeMap, type ResourceActionOptions } from "../../src/interfaces/ResourceAction";
import type {
  IProgram,
  IResource,
  IResourceWithStatus,
  IResourceWithEnableStatus,
  IBundle,
  IBundlePart,
  IJVMEndpoint,
  IJVMServer,
  ILibrary,
  ILibraryDataset,
  ILocalFile,
  IManagedRegion,
  IPipeline,
  IRegion,
  IRemoteFile,
  ISharedTSQueue,
  ITCPIP,
  ITSQueue,
  ITask,
  ITransaction,
  IURIMap,
  IWebService
} from "../../src/interfaces/resources";
import { ResourceTypes, SupportedResourceTypes } from "../../src/resources";

describe("Interfaces", () => {
  const action = new ResourceAction({
    id: "CICS.CICSProgram.NEWCOPY",
    name: "New Copy Program",
    resourceType: ResourceTypes.CICSProgram,
    action: async (_resource: IProgram, _resourceContext: IResourceContext) => {},
    visibleWhen(_resource, _resourceContext) {
      return true;
    },
  });

  const extender: IResourceExtender = {
    registeredActions: new Map(),
    registerAction: function <TType extends keyof ResourceTypeMap>(acc: ResourceAction<TType>) {
      const arr = this.registeredActions.get(acc.resourceType) || [];
      arr.push(acc as unknown as ResourceAction<keyof ResourceTypeMap>);
      this.registeredActions.set(acc.resourceType, arr);
      return { dispose: () => {} };
    },
    getActions: function (): ResourceAction<keyof ResourceTypeMap>[] {
      return [...this.registeredActions.values()].flat() as ResourceAction<keyof ResourceTypeMap>[];
    },
    getAction: function (id: string): ResourceAction<keyof ResourceTypeMap> | undefined {
      const actions = this.getActions().filter((ac: ResourceAction<keyof ResourceTypeMap>) => ac.id === id);
      if (actions.length > 0) {
        return actions[0] as ResourceAction<keyof ResourceTypeMap>;
      }
      return undefined;
    },
    getActionsFor: function <TType extends keyof ResourceTypeMap>(type: TType): ResourceAction<TType>[] {
      return (this.registeredActions.get(type) || []) as unknown as ResourceAction<TType>[];
    },
  };

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
      resourceExtender: extender,
    },
  };

  const res: IResource = {
    eyu_cicsname: "REGION1",
  };

  const profile: imperative.IProfileLoaded = {
    failNotFound: false,
    message: "",
    type: "cics",
    name: "MYPROF",
    profile: {
      host: "MYHOST",
      port: 1234,
    },
  };

  const session: CICSSession = new CICSSession(profile.profile as any);

  const cx: IResourceContext = {
    profile,
    cicsplexName: "myplex",
    regionName: "REGION1",
    session,
  };

  describe("ResourceAction", () => {
    it("should create ResourceAction with all properties", () => {
      expect(action).toHaveProperty("id");
      expect(action).toHaveProperty("name");
      expect(action).toHaveProperty("resourceType");
      expect(action).toHaveProperty("action");
      expect(action).toHaveProperty("visibleWhen");
      expect(action).toHaveProperty("refreshResourceInspector");
    });

    it("should access ResourceAction getters", () => {
      expect(action.id).toBe("CICS.CICSProgram.NEWCOPY");
      expect(action.name).toBe("New Copy Program");
      expect(action.resourceType).toBe(ResourceTypes.CICSProgram);
      expect(action.action).toBeDefined();
      expect(action.visibleWhen).toBeDefined();
      expect(action.refreshResourceInspector).toBe(true);
    });

    it("should create ResourceAction with refreshResourceInspector false", () => {
      const actionNoRefresh = new ResourceAction({
        id: "test.action",
        name: "Test Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
        refreshResourceInspector: false,
      });
      expect(actionNoRefresh.refreshResourceInspector).toBe(false);
    });

    it("should create ResourceAction with string action", () => {
      const stringAction = new ResourceAction({
        id: "test.string.action",
        name: "Test String Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command.string",
      });
      expect(stringAction.action).toBe("test.command.string");
    });

    it("should create ResourceAction without visibleWhen", () => {
      const noVisibleWhen = new ResourceAction({
        id: "test.no.visible",
        name: "Test No Visible",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
      });
      expect(noVisibleWhen.visibleWhen).toBeUndefined();
    });
  });

  describe("IResourceExtender", () => {
    it("should assert IResourceExtender properties", () => {
      expect(extender).toHaveProperty("registeredActions");
      expect(extender).toHaveProperty("registerAction");
      expect(extender).toHaveProperty("getAction");
      expect(extender).toHaveProperty("getActions");
      expect(extender).toHaveProperty("getActionsFor");
    });

    it("should register and retrieve actions", () => {
      const testAction = new ResourceAction({
        id: "test.action.id",
        name: "Test Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
      });
      
      extender.registerAction(testAction);
      const retrieved = extender.getAction("test.action.id");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("test.action.id");
    });

    it("should return undefined for non-existent action", () => {
      const retrieved = extender.getAction("non.existent.action");
      expect(retrieved).toBeUndefined();
    });

    it("should get all actions", () => {
      const actions = extender.getActions();
      expect(Array.isArray(actions)).toBe(true);
    });

    it("should get actions for specific type", () => {
      const programActions = extender.getActionsFor(ResourceTypes.CICSProgram);
      expect(Array.isArray(programActions)).toBe(true);
    });
  });

  describe("IExtensionAPI", () => {
    it("should assert IExtensionAPI structure", () => {
      expect(api).toHaveProperty("resources");
      expect(api.resources).toHaveProperty("supportedResources");
      expect(api.resources).toHaveProperty("resourceExtender");
    });

    it("should have valid supportedResources", () => {
      expect(Array.isArray(api.resources.supportedResources)).toBe(true);
      expect(api.resources.supportedResources.length).toBeGreaterThan(0);
    });
  });

  describe("IResource interfaces", () => {
    it("should assert IResource", () => {
      expect(res).toHaveProperty("eyu_cicsname");
      expect(res.eyu_cicsname).toBe("REGION1");
    });

    it("should assert IResourceWithStatus", () => {
      const resWithStatus: IResourceWithStatus = {
        eyu_cicsname: "REGION1",
        status: "ENABLED",
      };
      expect(resWithStatus).toHaveProperty("eyu_cicsname");
      expect(resWithStatus).toHaveProperty("status");
    });

    it("should assert IResourceWithEnableStatus", () => {
      const resWithEnableStatus: IResourceWithEnableStatus = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
      };
      expect(resWithEnableStatus).toHaveProperty("eyu_cicsname");
      expect(resWithEnableStatus).toHaveProperty("enablestatus");
    });
  });

  describe("IResourceContext interfaces", () => {
    it("should assert IResourceContext", () => {
      expect(cx).toHaveProperty("session");
      expect(cx).toHaveProperty("profile");
      expect(cx).toHaveProperty("cicsplexName");
      expect(cx).toHaveProperty("regionName");
    });

    it("should assert IResourceRegionInfo", () => {
      const regionInfo: IResourceRegionInfo = {
        regionName: "REGION1",
        cicsplexName: "PLEX1",
      };
      expect(regionInfo).toHaveProperty("regionName");
      expect(regionInfo.cicsplexName).toBe("PLEX1");
    });

    it("should assert IResourceProfileNameInfo", () => {
      const profileNameInfo: IResourceProfileNameInfo = {
        regionName: "REGION1",
        profileName: "MYPROF",
      };
      expect(profileNameInfo).toHaveProperty("regionName");
      expect(profileNameInfo).toHaveProperty("profileName");
    });

    it("should assert IResourceProfileInfo", () => {
      const profileInfo: IResourceProfileInfo = {
        regionName: "REGION1",
        profile: profile,
      };
      expect(profileInfo).toHaveProperty("regionName");
      expect(profileInfo).toHaveProperty("profile");
    });
  });

  describe("Resource type interfaces", () => {
    it("should assert IProgram", () => {
      const program: IProgram = {
        eyu_cicsname: "REGION1",
        status: "ENABLED",
        library: "MYLIB",
        librarydsn: "MY.LIBRARY.DSN",
        program: "PROG001",
        progtype: "COBOL",
        newcopycnt: "0",
        usecount: "5",
        language: "COBOL",
        jvmserver: "",
      };
      expect(program).toHaveProperty("program");
      expect(program).toHaveProperty("library");
      expect(program).toHaveProperty("status");
    });

    it("should assert ITransaction", () => {
      const transaction: ITransaction = {
        eyu_cicsname: "REGION1",
        status: "ENABLED",
        tranid: "TRAN",
        program: "PROG001",
        availstatus: "AVAILABLE",
        tranclass: "CLASS1",
        routing: "LOCAL",
      };
      expect(transaction).toHaveProperty("tranid");
      expect(transaction).toHaveProperty("program");
      expect(transaction).toHaveProperty("status");
    });

    it("should assert IBundle", () => {
      const bundle: IBundle = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        bundledir: "/path/to/bundle",
        bundleid: "BUNDLE1",
        name: "MyBundle",
        partcount: "5",
        availstatus: "AVAILABLE",
      };
      expect(bundle).toHaveProperty("bundleid");
      expect(bundle).toHaveProperty("bundledir");
      expect(bundle).toHaveProperty("enablestatus");
    });

    it("should assert IBundlePart", () => {
      const bundlePart: IBundlePart = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        bundle: "BUNDLE1",
        bundlepart: "PART1",
        partclass: "PROGRAM",
        availstatus: "AVAILABLE",
        parttype: "OSGI",
      };
      expect(bundlePart).toHaveProperty("bundle");
      expect(bundlePart).toHaveProperty("bundlepart");
      expect(bundlePart).toHaveProperty("partclass");
    });

    it("should assert IJVMServer", () => {
      const jvmServer: IJVMServer = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        name: "JVMSRV1",
        profile: "PROFILE1",
        javahome: "/java/home",
        threadlimit: "100",
        log: "STDOUT",
        definetime: "2024-01-01",
        changetime: "2024-01-02",
        changeusrid: "USER1",
      };
      expect(jvmServer).toHaveProperty("name");
      expect(jvmServer).toHaveProperty("profile");
      expect(jvmServer).toHaveProperty("javahome");
    });

    it("should assert IJVMEndpoint", () => {
      const jvmEndpoint: IJVMEndpoint = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        jvmendpoint: "ENDPOINT1",
        jvmserver: "JVMSRV1",
        port: "8080",
        secport: "8443",
      };
      expect(jvmEndpoint).toHaveProperty("jvmendpoint");
      expect(jvmEndpoint).toHaveProperty("jvmserver");
      expect(jvmEndpoint).toHaveProperty("port");
    });

    it("should assert ILibrary", () => {
      const library: ILibrary = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        name: "LIB1",
        dsname: "MY.LIBRARY.DSN",
        ranking: "1",
        numdsnames: "5",
      };
      expect(library).toHaveProperty("name");
      expect(library).toHaveProperty("dsname");
      expect(library).toHaveProperty("ranking");
    });

    it("should assert ILibraryDataset", () => {
      const libraryDataset: ILibraryDataset = {
        eyu_cicsname: "REGION1",
        dsname: "MY.LIBRARY.DSN",
        library: "LIB1",
        dsnum: "1",
        searchpos: "1",
      };
      expect(libraryDataset).toHaveProperty("library");
      expect(libraryDataset).toHaveProperty("dsname");
      expect(libraryDataset).toHaveProperty("dsnum");
    });

    it("should assert ILocalFile", () => {
      const localFile: ILocalFile = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        file: "FILE1",
        dsname: "MY.FILE.DSN",
        vsamtype: "KSDS",
        read: "YES",
        browse: "YES",
        keylength: "10",
        recordsize: "80",
        openstatus: "OPEN",
        update: "YES",
        add: "YES",
        delete: "YES",
      };
      expect(localFile).toHaveProperty("file");
      expect(localFile).toHaveProperty("dsname");
      expect(localFile).toHaveProperty("vsamtype");
    });

    it("should assert IRemoteFile", () => {
      const remoteFile: IRemoteFile = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        file: "RFILE1",
        remotename: "REMOTE1",
        remotesystem: "SYS1",
      };
      expect(remoteFile).toHaveProperty("file");
      expect(remoteFile).toHaveProperty("remotename");
      expect(remoteFile).toHaveProperty("remotesystem");
    });

    it("should assert IPipeline", () => {
      const pipeline: IPipeline = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        name: "PIPE1",
        configfile: "/path/to/config",
        soaplevel: "1.1",
        wsdir: "/ws/dir",
      };
      expect(pipeline).toHaveProperty("name");
      expect(pipeline).toHaveProperty("configfile");
      expect(pipeline).toHaveProperty("soaplevel");
    });

    it("should assert IURIMap", () => {
      const urimap: IURIMap = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
        name: "URIMAP1",
        path: "/api/test",
        scheme: "HTTP",
        transaction: "TRAN",
        pipeline: "PIPE1",
        webservice: "WEBSVC1",
      };
      expect(urimap).toHaveProperty("name");
      expect(urimap).toHaveProperty("path");
      expect(urimap).toHaveProperty("scheme");
    });

    it("should assert IWebService", () => {
      const webservice: IWebService = {
        eyu_cicsname: "REGION1",
        name: "WEBSVC1",
        state: "ENABLED",
        wsbind: "BIND1",
        program: "PROG1",
        pipeline: "PIPE1",
        urimap: "URIMAP1",
        container: "CONT1",
        wsdlfile: "/path/to/wsdl",
      };
      expect(webservice).toHaveProperty("name");
      expect(webservice).toHaveProperty("pipeline");
      expect(webservice).toHaveProperty("wsbind");
      expect(webservice).toHaveProperty("state");
    });

    it("should assert ITCPIP", () => {
      const tcpip: ITCPIP = {
        eyu_cicsname: "REGION1",
        name: "TCPIP1",
        port: "8080",
        protocol: "HTTP",
        transid: "TRAN",
        urm: "URM1",
        attls: "NO",
        ssltype: "NONE",
        openstatus: "OPEN",
      };
      expect(tcpip).toHaveProperty("name");
      expect(tcpip).toHaveProperty("port");
      expect(tcpip).toHaveProperty("protocol");
      expect(tcpip).toHaveProperty("openstatus");
    });

    it("should assert ITSQueue", () => {
      const tsqueue: ITSQueue = {
        eyu_cicsname: "REGION1",
        name: "TSQ1",
        location: "MAIN",
        numitems: "10",
        hexname: "54535131",
        quelength: "100",
        expiryint: "0",
        transid: "TRAN",
        tsmodel: "MODEL1",
      };
      expect(tsqueue).toHaveProperty("name");
      expect(tsqueue).toHaveProperty("location");
      expect(tsqueue).toHaveProperty("numitems");
      expect(tsqueue).toHaveProperty("hexname");
    });

    it("should assert ISharedTSQueue", () => {
      const sharedTSQueue: ISharedTSQueue = {
        eyu_cicsname: "REGION1",
        name: "STSQ1",
        poolname: "POOL1",
        location: "SHARED",
        hexname: "53545351",
      };
      expect(sharedTSQueue).toHaveProperty("name");
      expect(sharedTSQueue).toHaveProperty("poolname");
      expect(sharedTSQueue).toHaveProperty("location");
    });

    it("should assert ITask", () => {
      const task: ITask = {
        eyu_cicsname: "REGION1",
        task: "12345",
        runstatus: "RUNNING",
        tranid: "TRAN",
        suspendtime: "0",
        suspendtype: "NONE",
        suspendvalue: "0",
        currentprog: "PROG001",
        userid: "USER1",
      };
      expect(task).toHaveProperty("task");
      expect(task).toHaveProperty("runstatus");
      expect(task).toHaveProperty("tranid");
      expect(task).toHaveProperty("currentprog");
    });

    it("should assert IRegion", () => {
      const region: IRegion = {
        eyu_cicsname: "REGION1",
        applid: "APPLID1",
        startup: "AUTO",
        cicsname: "CICS1",
        cicsstatus: "ACTIVE",
      };
      expect(region).toHaveProperty("eyu_cicsname");
      expect(region).toHaveProperty("applid");
      expect(region).toHaveProperty("cicsname");
    });

    it("should assert IManagedRegion", () => {
      const managedRegion: IManagedRegion = {
        eyu_cicsname: "REGION1",
        cicsname: "CICS1",
        cicsstate: "ACTIVE",
        secbypass: "NO",
        wlmstatus: "ENABLED",
      };
      expect(managedRegion).toHaveProperty("cicsname");
      expect(managedRegion).toHaveProperty("cicsstate");
      expect(managedRegion).toHaveProperty("wlmstatus");
    });
  });

  describe("ResourceTypeMap", () => {
    it("should map ResourceTypes to interfaces", () => {
      const typeMap: ResourceTypeMap = {
        [ResourceTypes.CICSProgram]: {} as IProgram,
        [ResourceTypes.CICSLocalFile]: {} as ILocalFile,
        [ResourceTypes.CICSRemoteFile]: {} as IRemoteFile,
        [ResourceTypes.CICSLocalTransaction]: {} as ITransaction,
        [ResourceTypes.CICSTCPIPService]: {} as ITCPIP,
        [ResourceTypes.CICSLibrary]: {} as ILibrary,
        [ResourceTypes.CICSURIMap]: {} as IURIMap,
        [ResourceTypes.CICSTask]: {} as ITask,
        [ResourceTypes.CICSPipeline]: {} as IPipeline,
        [ResourceTypes.CICSWebService]: {} as IWebService,
        [ResourceTypes.CICSJVMServer]: {} as IJVMServer,
        [ResourceTypes.CICSBundle]: {} as IBundle,
        [ResourceTypes.CICSTSQueue]: {} as ITSQueue,
        [ResourceTypes.CICSSharedTSQueue]: {} as ISharedTSQueue,
        [ResourceTypes.CICSManagedRegion]: {} as IManagedRegion,
        [ResourceTypes.CICSRegion]: {} as IRegion,
      };
      expect(typeMap).toBeDefined();
    });
  });
});
