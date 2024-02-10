import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const RequestTimeout = (minutes = 1): CustomDecorator<string> => {
  return SetMetadata('request-timeout', minutes * 60 * 1000);
};
