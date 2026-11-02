/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { RoleEntity, RoleEnum } from '@/core/role/entity/role'
import { IRoleRepository } from '@/core/role/repository/role'
import { ICacheAsideAdapter } from '@/infra/cache/aside'
import { ILoggerAdapter } from '@/infra/logger'
import { ValidateSchema } from '@/utils/decorators'
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception'
import { Namespaces } from '@/utils/namespaces'
import { ApiTracingInput } from '@/utils/request'
import { IUsecase } from '@/utils/usecase'
import { InputValidator, SchemaInfer } from '@/utils/validator'

import { UserEntity, UserEntitySchema } from '../entity/user'
import { IUserRepository } from '../repository/user'

export const UserUpdateSchema = UserEntitySchema.pick({
  id: true
})
  .and(UserEntitySchema.pick({ name: true, email: true }).partial())
  .and(InputValidator.object({ roles: InputValidator.array(InputValidator.enum(RoleEnum)).optional() }))

export class UserUpdateUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly loggerService: ILoggerAdapter,
    private readonly roleRepository: IRoleRepository,
    private readonly cacheAside: ICacheAsideAdapter
  ) {}

  @ValidateSchema(UserUpdateSchema)
  async execute(input: UserUpdateInput, { tracing, user: userData }: ApiTracingInput): Promise<UserUpdateOutput> {
    const user = await this.userRepository.findOneWithRelation({ id: input.id }, { roles: true })

    if (!user) {
      throw new ApiNotFoundException('userNotFound')
    }

    const roles = await this.getRoles(input, user.roles as RoleEntity[])

    user.merge({ ...input, roles })

    const userExists = await this.userRepository.existsOnUpdate({ email: user.email }, user.id)

    if (userExists) {
      throw new ApiConflictException('userExists')
    }

    await this.userRepository.create(user.toData())
    await this.cacheAside.invalidate(Namespaces.userById(user.id))

    this.loggerService.info({ message: 'user updated.', metadata: { user: input } })

    const updated = await this.userRepository.findOne({ id: user.id })

    tracing.logEvent('user-updated', { action: 'updated', by: userData.id, entity: updated!.id })

    return updated!.toData()
  }

  private async getRoles(input: UserUpdateInput, currentRoles: RoleEntity[]): Promise<RoleEntity[]> {
    if (input.roles) {
      const roles = await this.roleRepository.findIn({ name: input.roles })

      if (roles.length < input.roles.length) {
        throw new ApiNotFoundException('roleNotFound')
      }

      return roles
    }

    return currentRoles
  }
}

export type UserUpdateInput = Partial<SchemaInfer<typeof UserUpdateSchema>>
export type UserUpdateOutput = UserEntity
