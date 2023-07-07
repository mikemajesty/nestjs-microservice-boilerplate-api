import * as jwt from 'jsonwebtoken';

import { AuthInput, AuthOutput } from './types';

export abstract class ITokenAdapter {
  abstract sign<T = jwt.SignOptions>(model: AuthInput, options?: T): AuthOutput;
  abstract verify<T = jwt.JwtPayload>(token: string): Promise<T | string | unknown>;
  abstract decode<T = jwt.JwtPayload>(token: string, complete?: boolean): T | string | unknown;
}
