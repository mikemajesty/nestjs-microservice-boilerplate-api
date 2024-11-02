import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { ICacheAdapter } from '@/infra/cache';
import { ILoggerAdapter } from '@/infra/logger';
import { ITokenAdapter } from '@/libs/token';
import { UserRequest } from '@/utils/request';
import { UUIDUtils } from '@/utils/uuid';

import { ApiUnauthorizedException } from '../../utils/exception';

@Injectable()
export class IsLoggedMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: ITokenAdapter,
    private readonly loggerService: ILoggerAdapter,
    private readonly redisService: ICacheAdapter
  ) {}
  async use(
    request: Request & { user: UserRequest; id: string },
    response: Response,
    next: NextFunction
  ): Promise<void> {
    const tokenHeader = request.headers.authorization;

    if (!request.headers?.traceid) {
      Object.assign(request.headers, { traceid: request['id'] ?? UUIDUtils.create() });
    }

    if (!tokenHeader) {
      response.status(HttpStatus.UNAUTHORIZED);
      request.id = request.headers.traceid as string;
      this.loggerService.logger(request, response);
      throw new ApiUnauthorizedException('no token provided');
    }

    const token = tokenHeader.split(' ')[1];

    const expiredToken = await this.redisService.get(token);

    request.id = request.headers.traceid as string;

    if (expiredToken) {
      next(new ApiUnauthorizedException('you have been logged out'));
    }

    const userDecoded = (await this.tokenService.verify<UserRequest>(token).catch((error) => {
      error.status = HttpStatus.UNAUTHORIZED;
      this.loggerService.logger(request, response);
      next(error);
    })) as UserRequest;

    request.user = userDecoded;

    next();
  }
}
