import { ApiQueryOptions, ApiResponseOptions } from '@nestjs/swagger';
import { ExamplesObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import { ApiErrorType } from '@/utils/exception';

import { DefaultErrorMessage } from '../http-status';

export const Swagger = {
  defaultResponseError<T = ApiErrorType>({
    status,
    route,
    message,
    description
  }: SwaggerErrorInput): ApiResponseOptions {
    return {
      schema: {
        example: {
          error: {
            code: status,
            traceid: '<traceId>',
            context: '<context>',
            message: [[DefaultErrorMessage[String(status)], message].find(Boolean)],
            timestamp: '<timestamp>',
            path: route
          }
        } as T
      },
      description,
      status
    };
  },
  defaultPaginateExceptions(input: PaginateExceptionsInput): ApiResponseOptions {
    const messages = {
      'filter exception': {
        description: 'filter field not allowed',
        value: [`filter key1 not allowed, allowed list: key2,key3`]
      },
      'sort exception': {
        description: 'sort field not allowed',
        value: [`sort key1 not allowed, allowed list: key2,key3`]
      },
      'invalid boolean filter': {
        description: 'invalid boolean filter',
        value: ['invalid boolean filter']
      },
      'invalid number filter': {
        description: 'invalid number filter',
        value: ['invalid number filter']
      },
      'invalid objectId filter': {
        description: 'invalid objectId filter',
        value: ['invalid objectId filter']
      },
      ...input?.additionalMessages
    };

    return this.defaultResponseWithMultiplesError({
      messages,
      status: 400,
      description: input?.message ?? 'paginate filter and sort exceptions.',
      route: input.url
    });
  },
  defaultResponseWithMultiplesError({
    status,
    route,
    messages,
    description
  }: MultiplesExceptionResponse): ApiResponseOptions {
    const examples: { [key: string]: unknown } = {};
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
        } as ApiErrorType,
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

  defaultResponseJSON<T = void>({ status, json, description }: SwaggerJSON<NoInfer<T>>): ApiResponseOptions {
    return {
      content: json
        ? {
            'application/json': {
              schema: {
                example: json as NoInfer<T>
              }
            }
          }
        : undefined,
      description,
      status
    };
  },

  defaultRequestJSON<T = void>(json: NoInfer<T>): ApiResponseOptions {
    return {
      schema: {
        example: json as NoInfer<T>
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
        description: `<b> sort with multiples key</b>: propertyName1:desc,propertyName2:asc`
      }),
      search: Swagger.defaultApiQueryOptions({
        name: 'search',
        required: false,
        description: `<b> search with multiples keys</b>: propertyName1:value,propertyName2:value <br> <b>search with multiples values</b>: propertyName1:value1|value2`
      })
    };
  },

  defaultApiQueryOptions({
    example,
    required,
    description,
    name
  }: ApiQueryOptions & { name: string }): ApiQueryOptions {
    return {
      schema: { example },
      required,
      description,
      name,
      explode: true,
      type: 'string'
    };
  }
};

type PaginateExceptionsInput = {
  url: string;
  additionalMessages?: MessagesOutput;
  message?: string;
};

type SwaggerErrorInput = {
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

type SwaggerJSON<T> = {
  status: number;
  json?: T;
  description?: string;
};

type MessagesOutput = {
  [key: string]: {
    value: string[];
    description: string;
  };
};

type NoInfer<T> = [T][T extends unknown ? 0 : never];

type MultiplesExceptionResponse = Omit<SwaggerErrorInput, 'message'> & { messages: MessagesOutput };
