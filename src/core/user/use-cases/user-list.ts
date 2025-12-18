/**
 * @see https://github.com/mikemajesty/nestjs-microservice-boilerplate-api/blob/master/guides/core/usecase.md
 */
import { ValidateSchema } from '@/utils/decorators'
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination'
import { SearchSchema } from '@/utils/search'
import { SortSchema } from '@/utils/sort'
import { IUsecase } from '@/utils/usecase'
import { InputValidator } from '@/utils/validator'

import { UserEntity } from '../entity/user'
import { IUserRepository } from '../repository/user'

export const UserListSchema = InputValidator.intersection(PaginationSchema, SortSchema.and(SearchSchema))

export class UserListUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserListSchema)
  async execute(input: UserListInput): Promise<UserListOutput> {
    return await this.userRepository.paginate(input)
  }
}

export type UserListInput = PaginationInput<UserEntity>
export type UserListOutput = PaginationOutput<UserEntity>
