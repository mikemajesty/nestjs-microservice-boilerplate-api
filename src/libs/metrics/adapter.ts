import {
  Attributes,
  Counter,
  Histogram,
  ObservableCounter,
  ObservableUpDownCounter,
  UpDownCounter
} from '@opentelemetry/api';

import { MetricOptionsInput } from './types';

export abstract class IMetricsAdapter {
  abstract getCounter(name: string, options?: MetricOptionsInput): Counter<Attributes>;
  abstract getUpDownCounter(name: string, options?: MetricOptionsInput): UpDownCounter<Attributes>;
  abstract getHistogram(name: string, options?: MetricOptionsInput): Histogram<Attributes>;
  abstract getObservableCounter(name: string, options?: MetricOptionsInput): ObservableCounter<Attributes>;
  abstract getObservableGauge(name: string, options?: MetricOptionsInput): ObservableCounter<Attributes>;
  abstract getObservableUpDownCounter(name: string, options?: MetricOptionsInput): ObservableUpDownCounter<Attributes>;
}
