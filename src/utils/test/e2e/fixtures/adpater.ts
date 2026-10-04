import { DataSource } from 'typeorm'

import { IRepository } from '@/infra/repository'
import { IEntity } from '@/utils/entity'

export interface ITestFixture<T extends IEntity> {
  entity: T | T[]
  override(entity: T): T
  clear(manager: DataSource): Promise<void>
  up(repository: IRepository<T>): Promise<void>
  down(repository: IRepository<T>): Promise<void>
}
