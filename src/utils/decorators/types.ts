export enum SearchTypeEnum {
  'like',
  'equal'
}

export type AllowedFilter<T> = {
  type: SearchTypeEnum;
  map?: string;
  name: keyof T;
};
