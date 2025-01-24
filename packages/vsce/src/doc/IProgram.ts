import { IResource } from "./IResourceTypes";


export interface IProgram extends IResource {
  program: string;
  status: string;
  newcopycnt?: string;
}

export const buildProgramLabel = (program: IProgram) => {

  let label = `${program.program}`;
  if (program.newcopycnt && parseInt(program.newcopycnt) > 0) {
    label += ` (New copy count: ${program.newcopycnt})`;
  }
  if (program.status.trim().toLowerCase() === "disabled") {
    label += " (Disabled)";
  }

  return label;
};

export const buildProgramContext = (program: IProgram) => {
  return `cicsprogram.${program.status.trim().toLowerCase()}.${program.program}`;
};
