import { Axios, AxiosInstance } from 'axios';

import { TracingType } from '@/utils/request';

export abstract class IHttpAdapter<T = Axios | AxiosInstance> {
  abstract instance(): T;
  abstract tracing?: TracingType;
}
