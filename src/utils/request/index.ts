/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/request.md
 */
import 'fastify'

import { AttributeValue, Context, Span, SpanStatus, Tracer } from '@opentelemetry/api'
import { FastifyRequest } from 'fastify'

import { UserEntity } from '@/core/user/entity/user'

import { IDGeneratorUtils } from '../id-generator'
import { AnyType } from '../types'

/**
 * Canonical key used everywhere a traceid is read/written: HTTP headers, span attributes,
 * logger metadata and exception fields. Centralized here so the name never drifts between
 * call sites (HTTP header names are normalized to lowercase by Node/Fastify, so this must
 * stay lowercase — see guides/utils/request.md).
 */
export const TRACEID_HEADER = 'traceid' as const

/**
 * Shared shape for any type that carries a traceid field. Centralizes the computed-key
 * declaration (`[TRACEID_HEADER]`) in one place — consumers compose it via intersection
 * (`& TraceIdField`) instead of repeating `[TRACEID_HEADER]: string` inline. Use
 * `Partial<TraceIdField>` when the field is optional.
 */
export type TraceIdField = {
  [TRACEID_HEADER]: string
}

export type TracingType = {
  span: Span
  tracer: Tracer
  setStatus: (status: SpanStatus) => void
  logEvent: (name: string, metadata: { action: string } & Record<string, unknown>) => void
  addAttribute: (key: string | typeof TRACEID_HEADER, value: AttributeValue) => void
  createSpan: (name: string, parent?: Context) => Span
  finish: () => void
} & TraceIdField

export type UserRequest = Pick<UserEntity, 'email' | 'name' | 'id'>

export interface ApiRequest {
  readonly body: AnyType
  tracing: TracingType
  readonly user: UserRequest
  readonly params: { [key: string]: string | number }
  readonly query: { [key: string]: string | number }
  readonly headers: Headers & { authorization: string } & Partial<TraceIdField>
  readonly url: string
  readonly files: {
    buffer: Buffer
    encoding: string
    fieldname: string
    mimetype: string
    originalname: string
    size: number
  }[]
}

export type ApiTracingInput = Pick<ApiRequest, 'user' | 'tracing'>

export type AppRequestHeaders = FastifyRequest['headers'] & { authorization?: string } & Partial<TraceIdField>

export type AppFastifyRequest = FastifyRequest & {
  headers: AppRequestHeaders
}

declare module 'fastify' {
  interface FastifyRequest {
    tracing?: TracingType
    user?: UserRequest
    context?: string
  }
}

const UUID_PATH_SEGMENT = /(^|\/)[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi
const OBJECT_ID_PATH_SEGMENT = /(^|\/)[0-9a-f]{24}(?=\/|$)/gi
const NUMBER_PATH_SEGMENT = /(^|\/)\d+(?=\/|$)/g

export const generalizePath = (path: string): string => {
  if (!path) return '/'

  return path
    .replace(UUID_PATH_SEGMENT, '$1:uuid')
    .replace(OBJECT_ID_PATH_SEGMENT, '$1:objectid')
    .replace(NUMBER_PATH_SEGMENT, '$1:number')
}

export const ensureTraceId = (request: AppFastifyRequest): string => {
  const traceid = (request.headers?.[TRACEID_HEADER] || request.id || IDGeneratorUtils.uuid()) as string

  request.headers[TRACEID_HEADER] = traceid
  request.id = traceid

  return traceid
}
