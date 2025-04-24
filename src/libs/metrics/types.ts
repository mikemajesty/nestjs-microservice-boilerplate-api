export type MetricOptionsInput = {
  description?: string;
  unit?: string;
  valueType?: ValueType;
  advice?: { explicitBucketBoundaries?: number[] };
};

export enum ValueType {
  INT = 0,
  DOUBLE = 1
}
