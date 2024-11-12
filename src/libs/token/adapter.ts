import { SignOutput } from './service';

export abstract class ITokenAdapter {
  abstract sign<T>(model: object, options?: T): SignOutput;
  abstract verify<T>(token: string): Promise<T>;
}
