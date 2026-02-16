import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { BirdEntity } from '@/core/bird/entity/bird'
import { IBirdRepository } from '@/core/bird/repository/bird'
import { BirdCreateUsecase } from '@/core/bird/use-cases/bird-create'
import { BirdDeleteUsecase } from '@/core/bird/use-cases/bird-delete'
import { BirdGetByIdUsecase } from '@/core/bird/use-cases/bird-get-by-id'
import { BirdListUsecase } from '@/core/bird/use-cases/bird-list'
import { BirdUpdateUsecase } from '@/core/bird/use-cases/bird-update'
import { RedisCacheModule } from '@/infra/cache/redis'
import { BirdSchema } from '@/infra/database/postgres/schemas/bird'
import { ILoggerAdapter, LoggerModule } from '@/infra/logger'
import { TokenLibModule } from '@/libs/token'
import { AuthenticationMiddleware } from '@/middlewares/middlewares'

import {
  IBirdCreateAdapter,
  IBirdDeleteAdapter,
  IBirdGetByIdAdapter,
  IBirdListAdapter,
  IBirdUpdateAdapter
} from './adapter'
import { BirdController } from './controller'
import { BirdRepository } from './repository'

@Module({
  imports: [TokenLibModule, LoggerModule, RedisCacheModule, TypeOrmModule.forFeature([BirdSchema])],
  controllers: [BirdController],
  providers: [
    {
      provide: IBirdRepository,
      useFactory: (repository: Repository<BirdSchema & BirdEntity>) => {
        return new BirdRepository(repository)
      },
      inject: [getRepositoryToken(BirdSchema)]
    },
    {
      provide: IBirdCreateAdapter,
      useFactory: (repository: IBirdRepository) => new BirdCreateUsecase(repository),
      inject: [IBirdRepository]
    },
    {
      provide: IBirdUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: IBirdRepository) => new BirdUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, IBirdRepository]
    },
    {
      provide: IBirdGetByIdAdapter,
      useFactory: (repository: IBirdRepository) => new BirdGetByIdUsecase(repository),
      inject: [IBirdRepository]
    },
    {
      provide: IBirdListAdapter,
      useFactory: (repository: IBirdRepository) => new BirdListUsecase(repository),
      inject: [IBirdRepository]
    },
    {
      provide: IBirdDeleteAdapter,
      useFactory: (repository: IBirdRepository) => new BirdDeleteUsecase(repository),
      inject: [IBirdRepository]
    }
  ],
  exports: [
    IBirdRepository,
    IBirdCreateAdapter,
    IBirdUpdateAdapter,
    IBirdGetByIdAdapter,
    IBirdListAdapter,
    IBirdDeleteAdapter
  ]
})
export class BirdModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes(BirdController)
  }
}
