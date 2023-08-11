import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel } from 'mongoose';

import { IBirdRepository } from '@/core/bird/repository/bird';
import { BirdCreateUsecase } from '@/core/bird/use-cases/bird-create';
import { BirdDeleteUsecase } from '@/core/bird/use-cases/bird-delete';
import { BirdGetByIdUsecase } from '@/core/bird/use-cases/bird-getByID';
import { BirdListUsecase } from '@/core/bird/use-cases/bird-list';
import { BirdUpdateUsecase } from '@/core/bird/use-cases/bird-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { ConnectionName } from '@/infra/database/enum';
import { Bird, BirdDocument, BirdSchema } from '@/infra/database/mongo/schemas/bird';
import { ILoggerAdapter, LoggerModule } from '@/infra/logger';
import { SecretsModule } from '@/infra/secrets';
import { TokenModule } from '@/libs/auth';
import { MongoRepositoryModelSessionType } from '@/utils/database/mongoose';
import { IsLoggedMiddleware } from '@/utils/middlewares/is-logged.middleware';

import {
  IBirdCreateAdapter,
  IBirdDeleteAdapter,
  IBirdGetByIDAdapter,
  IBirdListAdapter,
  IBirdUpdateAdapter
} from './adapter';
import { BirdController } from './controller';
import { BirdRepository } from './repository';

@Module({
  imports: [TokenModule, SecretsModule, LoggerModule, RedisCacheModule],
  controllers: [BirdController],
  providers: [
    {
      provide: IBirdRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<BirdDocument>;

        // use if you want transaction
        const repository: MongoRepositoryModelSessionType<PaginateModel<BirdDocument>> = connection.model<
          BirdDocument,
          Model
        >(Bird.name, BirdSchema);

        repository.connection = connection;

        // use if you not want transaction
        // const repository: PaginateModel<BirdDocument> = connection.model<BirdDocument, Model>(Bird.name, BirdSchema);

        return new BirdRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.USER)]
    },
    {
      provide: IBirdCreateAdapter,
      useFactory: (birdRepository: IBirdRepository, loggerService: ILoggerAdapter) => {
        return new BirdCreateUsecase(birdRepository, loggerService);
      },
      inject: [IBirdRepository, ILoggerAdapter]
    },
    {
      provide: IBirdUpdateAdapter,
      useFactory: (birdRepository: IBirdRepository, loggerService: ILoggerAdapter) => {
        return new BirdUpdateUsecase(birdRepository, loggerService);
      },
      inject: [IBirdRepository, ILoggerAdapter]
    },
    {
      provide: IBirdListAdapter,
      useFactory: (birdRepository: IBirdRepository) => {
        return new BirdListUsecase(birdRepository);
      },
      inject: [IBirdRepository]
    },
    {
      provide: IBirdDeleteAdapter,
      useFactory: (birdRepository: IBirdRepository) => {
        return new BirdDeleteUsecase(birdRepository);
      },
      inject: [IBirdRepository]
    },
    {
      provide: IBirdGetByIDAdapter,
      useFactory: (birdRepository: IBirdRepository) => {
        return new BirdGetByIdUsecase(birdRepository);
      },
      inject: [IBirdRepository]
    }
  ],
  exports: [
    IBirdRepository,
    IBirdCreateAdapter,
    IBirdUpdateAdapter,
    IBirdListAdapter,
    IBirdDeleteAdapter,
    IBirdGetByIDAdapter
  ]
})
export class BirdModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(BirdController);
  }
}
