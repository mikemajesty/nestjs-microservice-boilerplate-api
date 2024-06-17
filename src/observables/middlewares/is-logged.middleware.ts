import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { ILoggerAdapter } from '@/infra/logger';
import { ITokenAdapter } from '@/libs/token';

import { ApiUnauthorizedException } from '../../utils/exception';

@Injectable()
export class IsLoggedMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: ITokenAdapter,
    private readonly loggerService: ILoggerAdapter
  ) {}
  async use(request: Request, response: Response, next: NextFunction): Promise<void> {
    const tokenHeader = request.headers.authorization;

    if (!request.headers?.traceid) {
      request.headers.traceid = request['id'] ?? uuidv4();
    }

    if (!tokenHeader) {
      response.status(HttpStatus.UNAUTHORIZED);
      request['id'] = request.headers.traceid;
      this.loggerService.logger(request, response);
      throw new ApiUnauthorizedException('no token provided');
    }

    const token = tokenHeader.split(' ')[1];

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
