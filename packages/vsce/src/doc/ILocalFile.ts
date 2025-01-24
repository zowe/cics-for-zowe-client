import { IResource } from "./IResourceTypes";


export interface ILocalFile extends IResource {
  file: string;
  enablestatus: string;
  openstatus: string;
}

export const buildLocalFileLabel = (localFile: ILocalFile) => {

  let label = `${localFile.file}`;

  if (localFile.enablestatus.trim().toLowerCase() === "disabled") {
    label += ` (Disabled)`;
  } else if (localFile.enablestatus.trim().toLowerCase() === "unenabled") {
    label += ` (Unenabled)`;
  }

  if (localFile.openstatus.trim().toLowerCase() === "closed") {
    label += ` (Closed)`;
  }

  return label;
};

export const buildLocalFileContext = (localFile: ILocalFile) => {
  return `cicslocalfile.${localFile.enablestatus.trim().toLowerCase()}.${localFile.openstatus.trim().toLowerCase()}.${localFile.file}`;
};

