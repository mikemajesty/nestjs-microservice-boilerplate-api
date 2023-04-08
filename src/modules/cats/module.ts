import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatsCreateUsecase } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdUsecase } from '@/core/cats/use-cases/cats-getByID';
import { CatsListUsecase } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateUsecase } from '@/core/cats/use-cases/cats-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TokenModule } from '@/libs/auth';
import { IsLoggedMiddleware } from '@/utils/middlewares/is-logged.middleware';

import {
  ICatsCreateAdapter,
  ICatsDeleteAdapter,
  ICatsGetByIDAdapter,
  ICatsListAdapter,
  ICatsUpdateAdapter
} from './adapter';
import { CatsController } from './controller';
import { CatsRepository } from './repository';
import { CatsSchema } from './schema';

@Module({
  imports: [TokenModule, LoggerModule, TypeOrmModule.forFeature([CatsSchema]), RedisCacheModule],
  controllers: [CatsController],
  providers: [
    {
      provide: ICatsRepository,
      useFactory: (repository: Repository<CatsSchema & CatsEntity>) => {
        return new CatsRepository(repository);
      },
      inject: [getRepositoryToken(CatsSchema)]
    },
    {
      provide: ICatsCreateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ICatsRepository) => new CatsCreateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatsRepository]
    },
    {
      provide: ICatsUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ICatsRepository) => new CatsUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatsRepository]
    },
    {
      provide: ICatsGetByIDAdapter,
      useFactory: (repository: ICatsRepository) => new CatsGetByIdUsecase(repository),
      inject: [ICatsRepository]
    },
    {
      provide: ICatsListAdapter,
      useFactory: (repository: ICatsRepository) => new CatsListUsecase(repository),
      inject: [ICatsRepository]
    },
    {
      provide: ICatsDeleteAdapter,
      useFactory: (repository: ICatsRepository) => new CatsDeleteUsecase(repository),
      inject: [ICatsRepository]
    }
  ],
  exports: []
})
export class CatsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(CatsController);
  }
}
