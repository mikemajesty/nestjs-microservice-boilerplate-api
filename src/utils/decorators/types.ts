export enum SearchTypeEnum {
  'like',
  'equal'
}

export type AllowedFilter<T> = {
  type: SearchTypeEnum;
  name: keyof T;
};
