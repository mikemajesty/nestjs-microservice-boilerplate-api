import { SignOutput } from './service';

export abstract class ITokenAdapter {
  abstract sign<T>(model: object, options?: T): SignOutput;
  abstract verify<T = void>(token: string): Promise<NoInfer<T>>;
}
