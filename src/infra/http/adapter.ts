import { Axios } from 'axios';

export abstract class IHttpAdapter<T = Axios> {
  abstract instance(): T;
}
