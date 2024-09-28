import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { ICatRepository } from '@/core/cat/repository/cat';
import { CatCreateUsecase } from '@/core/cat/use-cases/cat-create';
import { CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete';
import { CatGetByIdUsecase } from '@/core/cat/use-cases/cat-get-by-id';
import { CatListUsecase } from '@/core/cat/use-cases/cat-list';
import { CatUpdateUsecase } from '@/core/cat/use-cases/cat-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat';
import { PostgresDatabaseModule } from '@/infra/database/postgres/module';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { TokenLibModule } from '@/libs/token';
import { IsLoggedMiddleware } from '@/observables/middlewares';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';

import {
  ICatCreateAdapter,
  ICatDeleteAdapter,
  ICatGetByIdAdapter,
  ICatListAdapter,
  ICatUpdateAdapter
} from './adapter';
import { CatController } from './controller';
import { CatRepository } from './repository';

@Module({
  imports: [TokenLibModule, LoggerModule, RedisCacheModule, PostgresDatabaseModule],
  controllers: [CatController],
  providers: [
    {
      provide: ICatRepository,
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

        return new CatRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.CATS)]
    },
    {
      provide: ICatCreateAdapter,
      useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ICatRepository) => new CatUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatRepository]
    },
    {
      provide: ICatGetByIdAdapter,
      useFactory: (repository: ICatRepository) => new CatGetByIdUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatListAdapter,
      useFactory: (repository: ICatRepository) => new CatListUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatDeleteAdapter,
      useFactory: (repository: ICatRepository) => new CatDeleteUsecase(repository),
      inject: [ICatRepository]
    }
  ],
  exports: []
})
export class CatModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(CatController);
  }
}
