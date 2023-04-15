import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ModelCtor, Sequelize } from 'sequelize-typescript';

import { DogEntity } from '@/core/dog/entity/dog';
import { IDogRepository } from '@/core/dog/repository/dog';
import { DogCreateUsecase } from '@/core/dog/use-cases/dog-create';
import { DogDeleteUsecase } from '@/core/dog/use-cases/dog-delete';
import { DogGetByIdUsecase } from '@/core/dog/use-cases/dog-getByID';
import { DogListUsecase } from '@/core/dog/use-cases/dog-list';
import { DogUpdateUsecase } from '@/core/dog/use-cases/dog-update';
import { RedisCacheModule } from '@/infra/cache/redis';
import { IDataBaseAdapter } from '@/infra/database';
import { CatSchema } from '@/infra/database/sequelize/schemas/cats';
import { LoggerModule } from '@/infra/logger';
import { TokenModule } from '@/libs/auth';
import { IsLoggedMiddleware } from '@/utils/middlewares/is-logged.middleware';

import { SequelizeDatabaseModule } from './../../infra/database/sequelize/module';
import {
  IDogCreateAdapter,
  IDogDeleteAdapter,
  IDogGetByIDAdapter,
  IDogListAdapter,
  IDogUpdateAdapter
} from './adapter';
import { DogController } from './controller';
import { DogRepository } from './repository';

@Module({
  imports: [TokenModule, LoggerModule, RedisCacheModule, SequelizeDatabaseModule],
  controllers: [DogController],
  providers: [
    {
      provide: IDogRepository,
      useFactory: (database: IDataBaseAdapter) => {
        const repository = database.getDatabase<Sequelize>().model(CatSchema);

        return new DogRepository(repository as ModelCtor<CatSchema> & DogEntity);
      },
      inject: [IDataBaseAdapter]
    },
    {
      provide: IDogCreateAdapter,
      useFactory: (repository: IDogRepository) => new DogCreateUsecase(repository),
      inject: [IDogRepository]
    },
    {
      provide: IDogUpdateAdapter,
      useFactory: (repository: IDogRepository) => new DogUpdateUsecase(repository),
      inject: [IDogRepository]
    },
    {
      provide: IDogGetByIDAdapter,
      useFactory: (repository: IDogRepository) => new DogGetByIdUsecase(repository),
      inject: [IDogRepository]
    },
    {
      provide: IDogListAdapter,
      useFactory: (repository: IDogRepository) => new DogListUsecase(repository),
      inject: [IDogRepository]
    },
    {
      provide: IDogDeleteAdapter,
      useFactory: (repository: IDogRepository) => new DogDeleteUsecase(repository),
      inject: [IDogRepository]
    }
  ],
  exports: []
})
export class DogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(DogController);
  }
}
