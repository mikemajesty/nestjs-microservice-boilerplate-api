/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/main/guides/core/usecase.md
 */
import { CreatedModel } from '@/infra/repository'
import { ValidateSchema } from '@/utils/decorators'
import { IDGeneratorUtils } from '@/utils/id-generator'
import { ApiTrancingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { Infer } from '@/utils/validator'

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
  async execute(input: CatCreateInput, { tracing, user }: ApiTrancingInput): Promise<CatCreateOutput> {
    const entity = new CatEntity({ id: IDGeneratorUtils.uuid(), ...input })

    const created = await this.catRepository.create(entity.toObject())

    tracing.logEvent('cat-created', `cat created by: ${user.email}`)

    return created
  }
}

export type CatCreateInput = Infer<typeof CatCreateSchema>
export type CatCreateOutput = CreatedModel
