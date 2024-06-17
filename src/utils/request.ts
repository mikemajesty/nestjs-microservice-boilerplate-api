import { AxiosInstance, AxiosRequestConfig } from 'axios';

import { UserEntity } from '@/core/user/entity/user';

export type TracingType = {
  axios: (config?: AxiosRequestConfig) => AxiosInstance;
};

export interface ApiRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly body: any;
  readonly tracing: TracingType;
  readonly user: Pick<UserEntity, 'email'>;
  readonly params: { [key: string]: string };
  readonly query: { [key: string]: string };
  readonly headers: Headers & { authorization: string };
  readonly url: string;
  readonly files: {
    buffer: Buffer;
    encoding: string;
    fieldname: string;
    mimetype: string;
    originalname: string;
    size: number;
  }[];
}

export type ApiTrancingInput = Pick<ApiRequest, 'user' | 'tracing'>;

export const getPathWithoutUUID = (path: string) =>
  path.replace(/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/, 'uuid');
