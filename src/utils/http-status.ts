/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/utils/http-status.md
 */
export const DefaultErrorMessage: { [key: string]: string } = {
  ECONNREFUSED: 'Connection Refused',
  401: "These aren't the droids you're looking for",
  403: 'You Shall Not Pass',
  404: 'The truth is out there',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Time is a flat circle',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  422: 'Unprocessable Entity',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  500: 'Houston, we have a problem.',
  501: 'Not Implemented',
  502: 'The cake is a lie',
  503: 'Winter is coming',
  504: 'Gateway Timeout',
  507: 'Insufficient Storage',
  508: "I've got déjà vu again"
}
