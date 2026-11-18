import { IRepository } from '@/infra/repository'
import { IEntity } from '@/utils/domain'

export interface ITestFixture<T extends IEntity> {
  entity: T | T[]
  override(entity: T): T
  up(repository: IRepository<T>): Promise<void>
  down(repository: IRepository<T>): Promise<void>
}
