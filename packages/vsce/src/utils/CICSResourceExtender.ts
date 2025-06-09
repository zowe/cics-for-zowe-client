import { programNewcopy } from "@zowe/cics-for-zowe-sdk";
import { CICSSession } from "../resources";
import { ILocalFile, IProgram, IResource } from "../doc";
import { openLocalFile } from "../commands/openLocalFileCommand";
import { runPutResource } from "./resourceUtils";
import { imperative } from "@zowe/zowe-explorer-api";

export interface IActionInput {
  session: CICSSession;
  profile: imperative.IProfileLoaded;
  cicsplexName: string;
  regionName: string;
  resource: IResource;
}

export interface IAvailableAction {
  id: string;
  resourceTypes: string[];
  visibleWhen?: (input: IActionInput) => boolean;
  action: (input: IActionInput) => Promise<boolean>;
}

class SCICSResourceExtender {

  private static _instance: SCICSResourceExtender;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  availableActions: Set<IAvailableAction>;

  private constructor() {
    this.availableActions = new Set([
      {
        id: "CICSProgram.NEWCOPY",
        resourceTypes: ["CICSProgram"],
        action: async (input: IActionInput) => {
          try {
            await programNewcopy(input.session, {
              name: (input.resource as IProgram).program,
              regionName: input.regionName,
              cicsPlex: input.cicsplexName,
            });
            return true;
          } catch (error) {
            return false;
          }
        },
        visibleWhen: (_input: IActionInput) => {
          return true;
        }
      },
      {
        id: "CICSLocalFile.OPEN",
        resourceTypes: ["CICSLocalFile"],

        action: async (input: IActionInput) => {
          try {

            await openLocalFile(input.session, {
              name: (input.resource as ILocalFile).file,
              regionName: input.regionName,
              cicsPlex: input.cicsplexName,
            });

            return true;
          } catch (error) {
            return false;
          }
        },
        visibleWhen: (input: IActionInput) => {
          return (input.resource as ILocalFile).openstatus === "CLOSED";
        }
      },
      {
        id: "CICSResource.ENABLE",
        resourceTypes: ["CICSProgram", "CICSLocalTransaction", "CICSLocalFile"],
        action: async (input: IActionInput) => {
          try {

            const resourceTypeMap: { [key: string]: string; } = {
              "IProgram": "CICSProgram",
              "ILocalFile": "CICSLocalFile",
              "ITransaction": "CICSLocalTransaction",
            };
            const resourceKeyMap: { [key: string]: string; } = {
              "IProgram": "program",
              "ILocalFile": "file",
              "ITransaction": "tranid",
            };

            await runPutResource(
              {
                session: input.session,
                resourceName: resourceTypeMap[typeof input.resource],
                cicsPlex: input.cicsplexName,
                regionName: input.regionName,
                params: {
                  criteria: `${resourceKeyMap[typeof input.resource]
                    }='${input.resource[resourceKeyMap[typeof input.resource] as keyof IResource]}'`
                },
              },
              {
                request: {
                  action: {
                    $: {
                      name: "ENABLE",
                    },
                  },
                },
              }
            );

            return true;
          } catch (error) {
            return false;
          }
        },
        visibleWhen: (_input: IActionInput) => {
          return true;
        }
      },
    ]);
  }

  public registerAction(actionToRegister: IAvailableAction) {
    this.availableActions.add(actionToRegister);
  }

  public removeAction(actionID: string) {
    this.availableActions.delete([...this.availableActions.values()].filter((action) => action.id === actionID)[0]);
  }

  public getActions() {
    return this.availableActions;
  }

}

const CICSResourceExtender = SCICSResourceExtender.Instance;
export default CICSResourceExtender;
