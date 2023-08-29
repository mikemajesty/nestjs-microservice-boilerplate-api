import { AxiosInstance, AxiosRequestConfig } from 'axios';
// import { JaegerTracer } from 'jaeger-client';
// import { Span, Tags } from 'opentracing';

import { UserEntity } from '@/core/user/entity/user';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { AttributeValue, Context, SpanStatus, TimeInput } from '@opentelemetry/api';

type LogEventType = AttributeValue | TimeInput;

export type TracingType = {
  span: any;
  tracer: any;
  tracerId: string;
  attributes: typeof SemanticAttributes;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
  setStatus: (status: SpanStatus) => void;
  logEvent: (name: string, attributesOrStartTime?: AttributeValue | TimeInput) => void;
  addAttribute: (key: string, value: AttributeValue) => void;
  createSpan: (name: string, parent?: Context) => any;
  finish: () => void;
};

export interface ApiRequest {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly tracing: TracingType;
  readonly user: UserEntity;
  readonly params: { [key: string]: string };
  readonly query: { [key: string]: string };
  readonly headers: Headers & { authorization: string };
  readonly url: string;
  readonly files: {
    buffer: Buffer;
    encoding: string;
    fieldname: string;
    mimetype: string;
    originalname: string;
    size: number;
  }[];
}

export type ApiTrancingInput = Pick<ApiRequest, 'user' | 'tracing'>;
