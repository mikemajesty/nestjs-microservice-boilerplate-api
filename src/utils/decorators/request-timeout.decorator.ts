import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const RequestTimeout = (milliseconds: number): CustomDecorator<string> => {
  return SetMetadata('request-timeout', milliseconds);
};
