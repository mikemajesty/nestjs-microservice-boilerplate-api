import { BaseException } from '@/utils/exception';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type HttpData = Record<string, unknown> | string | number | boolean | null | undefined;

export interface HttpResponse<T = unknown> {
  data: T | null;
  error: BaseException | null;
  headers: Record<string, string>;
  status: number;
  success: boolean;
  duration: number;
}
