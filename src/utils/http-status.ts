/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/http-status.md
 */
export const DefaultErrorMessage: { [key: string]: string } = {
  ECONNREFUSED: 'Connection refused',
  ETIMEDOUT: 'Connection timed out',
  ECONNRESET: 'Connection was reset',
  ENOTFOUND: 'Host not found',
  EHOSTUNREACH: 'Host unreachable',
  EAI_AGAIN: 'Temporary DNS error',
  401: 'Unauthorized',
  403: 'You Shall Not Pass',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  422: 'Unprocessable Entity',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  507: 'Insufficient Storage',
  508: 'Loop Detected'
}
