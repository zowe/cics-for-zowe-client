import { PersistentStorage } from "./PersistentStorage";

let pes: PersistentStorage;
export function setPersistentStorage(pesr: PersistentStorage) {
  pes = pesr;
}

export function getPersistentStorage(): PersistentStorage {
  return pes;
}
