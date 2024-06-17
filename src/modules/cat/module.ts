import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { ICatsRepository } from '@/core/cat/repository/cats';
import { CatsCreateUsecase } from '@/core/cat/use-cases/cats-create';
import { CatsDeleteUsecase } from '@/core/cat/use-cases/cats-delete';
import { CatsGetByIdUsecase } from '@/core/cat/use-cases/cats-get-by-id';
import { CatsListUsecase } from '@/core/cat/use-cases/cats-list';
import { CatsUpdateUsecase } from '@/core/cat/use-cases/cats-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat';
import { PostgresDatabaseModule } from '@/infra/database/postgres/module';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TokenLibModule } from '@/libs/token';
import { IsLoggedMiddleware } from '@/observables/middlewares';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';

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
  imports: [TokenLibModule, LoggerModule, RedisCacheModule, PostgresDatabaseModule],
  controllers: [CatsController],
  providers: [
    {
      provide: ICatsRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<CatDocument>;

        //  use if you want transaction
        const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> = connection.model<
          CatDocument,
          Model
        >(Cat.name, CatSchema as Schema);

        repository.connection = connection;

        // use if you not want transaction
        // const repository: PaginateModel<UserDocument> = connection.model<UserDocument, Model>(
        //   User.name,
        //   UserSchema as Schema
        // );

        return new CatsRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.CATS)]
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
