import { DataSource, EntityManager } from 'typeorm'

import { ResetPasswordEntity } from '@/core/reset-password/entity/reset-password'
import { IResetPasswordRepository } from '@/core/reset-password/repository/reset-password'
import { ResetPasswordSchema } from '@/infra/database/postgres/schemas/reset-password'
import { RunInTransactionType } from '@/infra/repository'

import { TestFixture } from './adpater'

export class ResetPasswordFixture implements Omit<TestFixture<ResetPasswordEntity>, 'override' | 'up' | `entity`> {
  async clear(manager: DataSource): Promise<void> {
    const dataSource = await manager.initialize()
    const entities = dataSource.entityMetadatas.filter((e) => e.name === ResetPasswordEntity.name)
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name)
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`)
    }
  }

  async down(repository: IResetPasswordRepository): Promise<void> {
    await repository.runInTransaction(async (context: RunInTransactionType) => {
      const ctx = context as EntityManager
      await ctx.deleteAll(ResetPasswordSchema)
    })
  }
}
