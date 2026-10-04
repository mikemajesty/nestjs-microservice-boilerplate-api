/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import { Connection, PaginateModel } from 'mongoose'

import { ICatRepository } from '@/core/cat/repository/cat'
import { CatCreateUsecase } from '@/core/cat/use-cases/cat-create'
import { CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdUsecase } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListUsecase } from '@/core/cat/use-cases/cat-list'
import { CatUpdateUsecase } from '@/core/cat/use-cases/cat-update'
import { CacheRedisModule } from '@/infra/cache/redis'
import { MongoConnectionName } from '@/infra/database'
import { Cat, CatDocument } from '@/infra/database/mongo/schemas/cat'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { TokenLibModule } from '@/libs/token'
import { MongoRepositoryModelSessionType } from '@/utils/mongoose'

import { CatController } from './controller'
import { ICatCreate, ICatDelete, ICatGetById, ICatList, ICatUpdate } from './interfaces'
import { CatRepository } from './repository'

@Module({
  imports: [TokenLibModule, LoggerModule, CacheRedisModule],
  controllers: [CatController],
  providers: [
    {
      provide: ICatRepository,
      useFactory: async (connection: Connection) => {
        const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> = new Cat().repository(connection)

        repository.connection = connection

        // use if you not want transaction
        // const repository = new Cat().repository(connection)

        return new CatRepository(repository)
      },
      inject: [getConnectionToken(MongoConnectionName.MONGO)]
    },
    {
      provide: ICatCreate,
      useFactory: (repository: ICatRepository) => new CatCreateUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatUpdate,
      useFactory: (logger: ILoggerAdapter, repository: ICatRepository) => new CatUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ICatRepository]
    },
    {
      provide: ICatGetById,
      useFactory: (repository: ICatRepository) => new CatGetByIdUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatList,
      useFactory: (repository: ICatRepository) => new CatListUsecase(repository),
      inject: [ICatRepository]
    },
    {
      provide: ICatDelete,
      useFactory: (repository: ICatRepository) => new CatDeleteUsecase(repository),
      inject: [ICatRepository]
    }
  ],
  exports: [ICatRepository, ICatCreate, ICatUpdate, ICatGetById, ICatList, ICatDelete]
})
export class CatModule {}
