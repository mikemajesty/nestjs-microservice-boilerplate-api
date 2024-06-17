import jwt from 'jsonwebtoken';

import { SignOutput } from './service';

export abstract class ITokenAdapter {
  abstract sign<T = jwt.SignOptions>(model: object, options?: T): SignOutput;
  abstract verify<T = jwt.JwtPayload>(token: string): Promise<T>;
}
