import { AttributeValue, Context, Span, SpanStatus, TimeInput, Tracer } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { AxiosInstance, AxiosRequestConfig } from 'axios';

import { UserEntity } from '@/core/user/entity/user';

export type TracingType = {
  span: Span;
  tracer: Tracer;
  tracerId: string;
  attributes: typeof SemanticAttributes;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
  setStatus: (status: SpanStatus) => void;
  logEvent: (name: string, attributesOrStartTime?: AttributeValue | TimeInput) => void;
  addAttribute: (key: string, value: AttributeValue) => void;
  createSpan: (name: string, parent?: Context) => Span;
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
