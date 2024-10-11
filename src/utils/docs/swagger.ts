import { ApiQueryOptions, ApiResponseOptions } from '@nestjs/swagger';
import { ExamplesObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { ErrorModel } from '@/utils/exception';
import httpStatus from '@/utils/static/http-status.json';

export const Swagger = {
  defaultResponseError({ status, route, message, description }: SwaggerError): ApiResponseOptions {
    return {
      schema: {
        example: {
          error: {
            code: status,
            traceid: '<traceId>',
            context: 'context',
            message: [[httpStatus[String(status)], message].find(Boolean)],
            timestamp: '<timestamp>',
            path: route
          }
        } as ErrorModel
      },
      description,
      status
    };
  },

  defaultResponseWithMultiplesError({
    status,
    route,
    messages,
    description
  }: Omit<SwaggerError, 'message'> & {
    messages: { [key: string]: { value: string[]; description: string } };
  }): ApiResponseOptions {
    const examples = {};
    for (const key in messages) {
      examples[`${key}`] = {
        value: {
          error: {
            code: status,
            traceid: '<traceId>',
            context: '<context>',
            message: messages[`${key}`].value,
            timestamp: '<timestamp>',
            path: route
          }
        } as ErrorModel,
        description: messages[`${key}`].description
      };
    }
    return {
      content: {
        'application/json': {
          examples: examples as ExamplesObject
        }
      },
      description,
      status
    };
  },

  defaultResponseText({ status, text, description }: SwaggerText): ApiResponseOptions {
    return {
      content: {
        'text/plain': {
          schema: {
            example: text
          }
        }
      },
      description,
      status
    };
  },

  defaultResponseJSON({ status, json, description }: SwaggerJSON): ApiResponseOptions {
    return {
      content: json
        ? {
            'application/json': {
              schema: {
                example: json
              }
            }
          }
        : undefined,
      description,
      status
    };
  },

  defaultRequestJSON(json: unknown): ApiResponseOptions {
    return {
      schema: {
        example: json
      }
    };
  },

  defaultRequestListJSON(): {
    pagination: { limit: ApiQueryOptions; page: ApiQueryOptions };
    sort: ApiQueryOptions;
    search: ApiQueryOptions;
  } {
    return {
      pagination: {
        limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
        page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
      },
      sort: Swagger.defaultApiQueryOptions({
        name: 'sort',
        required: false,
        description: `<b>propertyName1:desc,propertyName2:asc`
      }),
      search: Swagger.defaultApiQueryOptions({
        name: 'search',
        required: false,
        description: `<b>propertyName1:value,propertyName2:value`
      })
    };
  },

  defaultApiQueryOptions({ example, name, required, description }: ApiQueryOptions): ApiQueryOptions {
    return {
      schema: { example },
      required,
      name,
      description,
      explode: true,
      type: 'string'
    };
  }
};

type SwaggerError = {
  status: number;
  route: string;
  message?: string | unknown;
  description?: string;
};

type SwaggerText = {
  status: number;
  text: string | unknown;
  description?: string;
};

type SwaggerJSON = {
  status: number;
  json?: unknown;
  description?: string;
};
