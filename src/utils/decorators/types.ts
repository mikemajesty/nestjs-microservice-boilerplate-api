export enum SearchTypeEnum {
  'like',
  'equal'
}

export type AllowedFilter<T> = {
  type: SearchTypeEnum;
  map?: string;
  format?: 'String' | 'Number' | 'Date' | 'DateIso' | 'Boolean' | 'ObjectId';
  name: keyof T;
};
