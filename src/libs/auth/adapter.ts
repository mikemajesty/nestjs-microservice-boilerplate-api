import jwt from 'jsonwebtoken';

import { SignInput, SignOutput } from './service';

export abstract class ITokenAdapter {
  abstract sign<T = jwt.SignOptions>(model: SignInput, options?: T): SignOutput;
  abstract verify<T = jwt.JwtPayload>(token: string): Promise<T | string | unknown>;
  abstract decode<T = jwt.JwtPayload>(token: string, complete?: boolean): T | string | unknown;
}
