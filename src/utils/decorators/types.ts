export type AllowedFilter = {
  type: SearchTypeEnum;
  name: string;
};

export enum SearchTypeEnum {
  'like',
  'equal'
}
