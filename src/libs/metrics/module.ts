import { Module } from '@nestjs/common';
import { MetricService, OpenTelemetryModule } from 'nestjs-otel';

import { IMetricsAdapter } from './adapter';
import { MetricsService } from './service';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
    apiMetrics: {
      enable: true,
      ignoreRoutes: ['/favicon.ico'],
      ignoreUndefinedRoutes: false
    }
  }
});

@Module({
  imports: [OpenTelemetryModuleConfig],
  providers: [
    {
      provide: IMetricsAdapter,
      useFactory: (metrics: MetricService) => new MetricsService(metrics),
      inject: [MetricService]
    }
  ],
  exports: [IMetricsAdapter]
})
export class MetricsLibModule {}
