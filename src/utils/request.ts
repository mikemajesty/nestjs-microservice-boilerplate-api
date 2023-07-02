import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JaegerTracer } from 'jaeger-client';
import { Span, Tags } from 'opentracing';

export type TracingType = {
  span: Span;
  tracer: JaegerTracer;
  tracerId: string;
  tags: typeof Tags;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
  log: (event: { [key: string]: unknown }) => void;
  setTag: (key: string, value: unknown) => void;
  addTags: (object: object) => void;
  createSpan: (name: string, parent?: Span) => Span;
  finish: () => void;
};

export interface ApiRequest {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly tracing: TracingType;
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
