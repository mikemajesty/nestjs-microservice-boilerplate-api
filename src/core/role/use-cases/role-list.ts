import { z } from 'zod';

import { RoleEntity } from '@/core/role/entity/role';
import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';

import { IRoleRepository } from '../repository/role';

export const RoleListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type RoleListInput = PaginationInput<RoleEntity>;
export type RoleListOutput = PaginationOutput<RoleEntity>;

export class RoleListUsecase implements IUsecase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  @ValidateSchema(RoleListSchema)
  async execute(input: RoleListInput): Promise<RoleListOutput> {
    return await this.roleRepository.paginate(input);
  }
}
