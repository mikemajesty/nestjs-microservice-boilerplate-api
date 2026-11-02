/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { CreatedModel } from '@/infra/repository'
import { ValidateSchema } from '@/utils/decorators'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { CatEntity, CatEntitySchema } from '../entity/cat'
import { ICatRepository } from '../repository/cat'

export const CatCreateSchema = CatEntitySchema.pick({
  name: true,
  breed: true,
  age: true
})

export class CatCreateUsecase implements IUsecase {
  constructor(private readonly catRepository: ICatRepository) {}

  @ValidateSchema(CatCreateSchema)
  async execute(input: CatCreateInput, { tracing, user }: ApiTracingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: IDGeneratorUtils.uuid(), ...input })

    const created = await this.catRepository.create(entity.toData())

    tracing.logEvent('cat-created', { action: 'created', by: user.id, entity: created.id })

    return created
  }
}

export type CatCreateInput = SchemaInfer<typeof CatCreateSchema>
export type CatCreateOutput = CreatedModel
