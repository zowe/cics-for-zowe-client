import { IResource } from "./IResourceTypes";


export interface ITransaction extends IResource {
  tranid: string;
  program: string;
  status: string;
}

export const buildTransactionLabel = (transaction: ITransaction) => {

  let label = `${transaction.tranid}`;

  if (transaction.status.trim().toLowerCase() === "disabled") {
    label += " (Disabled)";
  }

  return label;
};

export const buildTransactionContext = (transaction: ITransaction) => {
  return `cicstransaction.${transaction.status.toLowerCase()}.${transaction.tranid}`;
};

export const buildTransactionIconName = (transaction: ITransaction) => {
  return `local-transaction`;
};
