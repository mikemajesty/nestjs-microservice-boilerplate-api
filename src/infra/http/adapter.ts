import { Axios } from 'axios';

import { TracingType } from '@/utils/request';

export abstract class IHttpAdapter<T = Axios> {
  abstract instance(): T;
  abstract tracing?: TracingType;
}
