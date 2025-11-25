/* eslint-disable security/detect-unsafe-regex */
import { AttributeValue, Context, Span, SpanStatus, TimeInput, Tracer } from '@opentelemetry/api';
import { AxiosInstance, AxiosRequestConfig } from 'axios';

import { UserEntity } from '@/core/user/entity/user';

export type TracingType = {
  span: Span;
  tracer: Tracer;
  tracerId: string;
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
  setStatus: (status: SpanStatus) => void;
  logEvent: (name: string, attributesOrStartTime?: AttributeValue | TimeInput) => void;
  addAttribute: (key: string, value: AttributeValue) => void;
  createSpan: (name: string, parent?: Context) => Span;
  finish: () => void;
};

export type UserRequest = Pick<UserEntity, 'email' | 'name' | 'id'>;

export interface ApiRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly tracing: TracingType;
  readonly user: UserRequest;
  readonly params: { [key: string]: string | number };
  readonly query: { [key: string]: string | number };
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

export const generalizePath = (path: string): string => {
  if (!path) return '/';

  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, ':uuid')
    .replace(/\/\d{1,9}(?=\/|$)/g, '/:id')
    .replace(/\/\d{1,6}(?:,\d{1,6}){0,9}\//g, '/:ids/')
    .replace(/\/(?:1\d{9}|[2-9]\d{9})(?=\/|$)/g, '/:timestamp')
    .replace(/\/[a-z0-9]+(?:-[a-z0-9]+)*\/?/gi, '/:slug')
    .replace(/\/:(\w+)(?:\/:\1)+/g, '/:$1');
};
