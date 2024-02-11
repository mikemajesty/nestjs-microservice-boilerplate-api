import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ModelCtor, Sequelize } from 'sequelize-typescript';

import { IsLoggedMiddleware } from '@/common/middlewares';
import { CatsEntity } from '@/core/cats/entity/cats';
import { ICatsRepository } from '@/core/cats/repository/cats';
import { CatsCreateUsecase } from '@/core/cats/use-cases/cats-create';
import { CatsDeleteUsecase } from '@/core/cats/use-cases/cats-delete';
import { CatsGetByIdUsecase } from '@/core/cats/use-cases/cats-get-by-id';
import { CatsListUsecase } from '@/core/cats/use-cases/cats-list';
import { CatsUpdateUsecase } from '@/core/cats/use-cases/cats-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { IDataBaseAdapter } from '@/infra/database';
import { PostgresDatabaseModule } from '@/infra/database/postgres/module';
import { CatsSchema } from '@/infra/database/postgres/schemas/cats';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TokenModule } from '@/libs/auth';

import {
  ICatsCreateAdapter,
  ICatsDeleteAdapter,
  ICatsGetByIdAdapter,
  ICatsListAdapter,
  ICatsUpdateAdapter
} from './adapter';
import { CatsController } from './controller';
import { CatsRepository } from './repository';

@Module({
  imports: [TokenModule, LoggerModule, RedisCacheModule, PostgresDatabaseModule],
  controllers: [CatsController],
  providers: [
    {
      provide: ICatsRepository,
      useFactory: (database: IDataBaseAdapter) => {
        const repository = database.getDatabase<Sequelize>().model(CatsSchema);
        return new CatsRepository(repository as ModelCtor<CatsSchema> & CatsEntity);
      },
      inject: [IDataBaseAdapter]
    },
    {
      provide: ICatsCreateAdapter,
      useFactory: (repository: ICatsRepository) => new CatsCreateUsecase(repository),
      inject: [ICatsRepository]
    },
    {
      provide: ICatsUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ICatsRepository) => new CatsUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatsRepository]
    },
    {
      provide: ICatsGetByIdAdapter,
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
