import { z } from 'zod';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { ValidateSchema } from '@/utils/decorators';
import { PaginationInput, PaginationOutput, PaginationSchema } from '@/utils/pagination';
import { SearchSchema } from '@/utils/search';
import { SortSchema } from '@/utils/sort';
import { IUsecase } from '@/utils/usecase';

import { IPermissionRepository } from '../repository/permission';

export const PermissionListSchema = z.intersection(PaginationSchema, SortSchema.merge(SearchSchema));

export type PermissionListInput = PaginationInput<PermissionEntity>;
export type PermissionListOutput = PaginationOutput<PermissionEntity>;

export class PermissionListUsecase implements IUsecase {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  @ValidateSchema(PermissionListSchema)
  async execute(input: PermissionListInput): Promise<PermissionListOutput> {
    return await this.permissionRepository.paginate(input);
  }
}
