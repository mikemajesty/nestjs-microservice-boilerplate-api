import { EntityManager, FindOptionsWhere, ObjectLiteral } from 'typeorm'

import { IRepository, RunInTransactionType } from '@/infra/repository'
import { IEntity } from '@/utils/entity'

export abstract class DatabaseFixture<TSchema extends ObjectLiteral> {
  protected constructor(private readonly schema: new () => TSchema) {}

  protected async deleteAllRows<TEntity extends IEntity>(repository: IRepository<TEntity>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const manager = context as EntityManager
      await manager.deleteAll(this.schema)
    })
  }

  protected async insertIfNotExists<TEntity extends IEntity>({
    repository,
    entities,
    where
  }: InsertIfNotExistsInput<TEntity, TSchema>): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const manager = context as EntityManager

      for (const entity of entities) {
        const exists = await manager.findOne(this.schema, { where: where(entity) })
        if (exists) continue

        const model = Object.assign(new this.schema(), entity)
        await manager.save(this.schema, model)
      }
    })
  }
}

export type InsertIfNotExistsInput<TEntity extends IEntity, TSchema extends ObjectLiteral> = {
  repository: IRepository<TEntity>
  entities: TEntity[]
  where: (entity: TEntity) => FindOptionsWhere<TSchema>
}
