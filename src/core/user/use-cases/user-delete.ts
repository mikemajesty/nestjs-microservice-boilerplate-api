/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { SchemaInfer } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../entity/user'
import { IUserRepository } from '../repository/user'

export const UserDeleteSchema = UserEntitySchema.pick({
  id: true
})

export class UserDeleteUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cacheAside: ICacheAsideAdapter
  ) {}

  @ValidateSchema(UserDeleteSchema)
  async execute({ id }: UserDeleteInput, { tracing, user: userData }: ApiTracingInput): Promise<UserDeleteOutput> {
    const user = await this.userRepository.findOneWithRelation({ id }, { password: true })

    if (!user) {
      throw new ApiNotFoundException('userNotFound')
    }

    user.deactivate()

    await this.userRepository.softRemove({ id: user.id })
    await this.cacheAside.invalidate(Namespaces.userById(user.id))

    tracing.logEvent('user-deleted', { action: 'deleted', by: userData.id, entity: user.id })

    return user.toData()
  }
}

export type UserDeleteInput = SchemaInfer<typeof UserDeleteSchema>
export type UserDeleteOutput = UserEntity
