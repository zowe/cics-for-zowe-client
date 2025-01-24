
export interface ResourceMeta<T> {

  resourceName: string;
  humanReadableName: string;
  contextPrefix: string;
  combinedContextPrefix: string;
  filterAttribute: string;
  primaryKeyAttribute: string;

  persistentStorageKey: string;
  persistentStorageAllKey: string;

  getDefaultFilter(): Promise<string>;
  getLabel(resource: T): string;
  getContext(resource: T): string;
  getIconName(resource: T): string;

}

export default ResourceMeta;
