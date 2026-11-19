/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ISessionAdapter } from '@/libs/session'
import { ValidateSchema } from '@/utils/decorators'
import { ApiNotFoundException } from '@/utils/exception'
import { InferSchema, Schema } from '@/utils/schema'
import { IUsecase } from '@/utils/usecase'

import { UserEntity } from '../entity/user'
import { IUserRepository } from '../repository/user'

export const RefreshTokenSchema = Schema.object({ refreshToken: Schema.string().trim().min(1) })

export class RefreshTokenUsecase implements IUsecase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly session: ISessionAdapter
  ) {}

  @ValidateSchema(RefreshTokenSchema)
  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    return this.session.rotate({ refreshToken: input.refreshToken, loadUser: (userId) => this.loadUser(userId) })
  }

  private async loadUser(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneWithRelation({ id: userId }, { roles: true })

    if (!user) {
      throw new ApiNotFoundException('userNotFound')
    }

    if (!user.roles.length) {
      throw new ApiNotFoundException('roleNotFound')
    }

    return user
  }
}

export type RefreshTokenInput = InferSchema<typeof RefreshTokenSchema>
export type RefreshTokenOutput = { accessToken: string; refreshToken: string }
