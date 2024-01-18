import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { ICacheAdapter } from '@/infra/cache';
import { ILoggerAdapter } from '@/infra/logger';
import { ITokenAdapter } from '@/libs/auth';

import { ApiUnauthorizedException } from '../exception';

@Injectable()
export class IsLoggedMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: ITokenAdapter,
    private readonly loggerService: ILoggerAdapter,
    private readonly redisService: ICacheAdapter
  ) {}
  async use(request: Request, response: Response, next: NextFunction): Promise<void> {
    const tokenHeader = request.headers.authorization;

    if (!request.headers?.traceid) {
      request.headers.traceid = uuidv4();
    }

    if (!tokenHeader) {
      response.status(HttpStatus.UNAUTHORIZED);
      request['id'] = request.headers.traceid;
      this.loggerService.logger(request, response);
      throw new ApiUnauthorizedException('no token provided');
    }

    const token = tokenHeader.split(' ')[1];

    const expiredToken = await this.redisService.get(token);

    if (expiredToken) {
      request.id = request.headers.traceid;
      next(new ApiUnauthorizedException('you have been logged out'));
    }

    const userDecoded = await this.tokenService.verify(token).catch((error) => {
      request.id = request.headers.traceid;
      error.status = HttpStatus.UNAUTHORIZED;
      this.loggerService.logger(request, response);
      next(error);
    });

    request['user'] = userDecoded;

    next();
  }
}
