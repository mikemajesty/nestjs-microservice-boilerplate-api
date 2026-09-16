/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/modules/module.md
 */
import { Module } from '@nestjs/common'
import { getConnectionToken } from '@nestjs/mongoose'
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose'

import { ICatRepository } from '@/core/cat/repository/cat'
import { CatCreateUsecase } from '@/core/cat/use-cases/cat-create'
import { CatDeleteUsecase } from '@/core/cat/use-cases/cat-delete'
import { CatGetByIdUsecase } from '@/core/cat/use-cases/cat-get-by-id'
import { CatListUsecase } from '@/core/cat/use-cases/cat-list'
import { CatUpdateUsecase } from '@/core/cat/use-cases/cat-update'
import { CacheRedisModule } from '@/infra/cache/redis'
import { ConnectionName } from '@/infra/database/enum'
import { Cat, CatDocument, CatSchema } from '@/infra/database/mongo/schemas/cat'
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
        type Model = mongoose.PaginateModel<CatDocument>

        //  use if you want transaction
        const repository: MongoRepositoryModelSessionType<PaginateModel<CatDocument>> = connection.model<
          CatDocument,
          Model
        >(Cat.name, CatSchema as Schema)

        repository.connection = connection

        // use if you not want transaction
        // const repository: PaginateModel<UserDocument> = connection.model<UserDocument, Model>(
        //   User.name,
        //   UserSchema as Schema
        // );

        return new CatRepository(repository)
      },
      inject: [getConnectionToken(ConnectionName.CATS)]
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
