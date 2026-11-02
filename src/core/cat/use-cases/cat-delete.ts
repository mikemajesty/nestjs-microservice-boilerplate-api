/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ICatRepository } from '@/core/cat/repository/cat'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { CatEntity, CatEntitySchema } from '../entity/cat'

export const CatDeleteSchema = CatEntitySchema.pick({
  id: true
})

export class CatDeleteUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatDeleteSchema)
  async execute({ id }: CatDeleteInput, { tracing, user }: ApiTracingInput): Promise<CatDeleteOutput> {
    const cat = await this.catRepository.findById(id)

    if (!cat) {
      throw new ApiNotFoundException()
    }

    cat.deactivate()

    await this.catRepository.softRemove({ id: cat.id })
    tracing.logEvent('cat-deleted', { action: 'deleted', by: user.id, entity: id })

    return cat.toData()
  }
}

export type CatDeleteInput = SchemaInfer<typeof CatDeleteSchema>
export type CatDeleteOutput = CatEntity
