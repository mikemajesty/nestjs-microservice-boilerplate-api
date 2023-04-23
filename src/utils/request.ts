import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JaegerTracer } from 'jaeger-client';
import { Span, Tags } from 'opentracing';

export type TracingType = {
  span: Span;
  tracer: JaegerTracer;
  tags: typeof Tags;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
  log: (event: string, payload: unknown) => void;
  setTag: (key: string, value: unknown) => void;
  addTags: (object: object) => void;
  setTracingTag: (tag: string, value: unknown) => void;
  createSpan: (name: string, parent?: Span) => Span;
  finish: () => void;
};

export interface ApiRequest extends Body {
  readonly id: string;
  readonly cache: RequestCache;
  readonly tracing: TracingType;
  readonly credentials: RequestCredentials;
  readonly destination: RequestDestination;
  readonly headers: Headers;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly method: string;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
  readonly url: string;
  clone(): Request;
}
