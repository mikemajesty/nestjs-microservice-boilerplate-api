import { z } from 'zod';

import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';

import { UserEntity } from '../entity/user';
import { IUserRepository } from '../repository/user';

export const UserListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type UserListInput = PaginationInput<UserEntity>;
export type UserListOutput = PaginationOutput<UserEntity>;

export class UserListUsecase implements IUsecase {
  constructor(private readonly userRepository: IUserRepository) {}

  @ValidateSchema(UserListSchema)
  async execute(input: UserListInput): Promise<UserListOutput> {
    const users = await this.userRepository.paginate(input);

    return {
      docs: users.docs.map((u) => {
        const entity = new UserEntity(u);
        return entity;
      }),
      limit: users.limit,
      page: users.page,
      total: users.total
    };
  }
}
