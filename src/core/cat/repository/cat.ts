/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/repository.md
 */
import { IRepository } from '@/infra/repository'

import { CatEntity } from '../entity/cat'
import { CatListInput, CatListOutput } from '../use-cases/cat-list'

export abstract class ICatRepository extends IRepository<CatEntity> {
  abstract paginate(input: CatListInput): Promise<CatListOutput>
}
