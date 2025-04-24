import { Injectable } from '@nestjs/common';
import {
  Attributes,
  Counter,
  Histogram,
  ObservableCounter,
  ObservableUpDownCounter,
  UpDownCounter
} from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';

import { IMetricsAdapter } from './adapter';
import { MetricOptionsInput } from './types';

@Injectable()
export class MetricsService implements IMetricsAdapter {
  constructor(private readonly metrics: MetricService) {}

  getCounter(name: string, options?: MetricOptionsInput): Counter<Attributes> {
    return this.metrics.getCounter(name, options);
  }

  getUpDownCounter(name: string, options?: MetricOptionsInput): UpDownCounter<Attributes> {
    return this.metrics.getUpDownCounter(name, options);
  }

  getHistogram(name: string, options?: MetricOptionsInput): Histogram<Attributes> {
    return this.metrics.getHistogram(name, options);
  }

  getObservableCounter(name: string, options?: MetricOptionsInput): ObservableCounter<Attributes> {
    return this.metrics.getObservableCounter(name, options);
  }

  getObservableGauge(name: string, options?: MetricOptionsInput): ObservableCounter<Attributes> {
    return this.metrics.getObservableGauge(name, options);
  }

  getObservableUpDownCounter(name: string, options?: MetricOptionsInput): ObservableUpDownCounter<Attributes> {
    return this.metrics.getObservableUpDownCounter(name, options);
  }
}
